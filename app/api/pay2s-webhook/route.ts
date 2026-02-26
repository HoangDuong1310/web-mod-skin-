import { NextRequest, NextResponse } from 'next/server';

const EXPECTED_TOKEN = process.env.PAY2S_WEBHOOK_TOKEN || 'your_expected_token_here';

export async function POST(req: NextRequest) {

  // Dùng lại ratelimit của ông
  const { strictLimiter } = await import('@/lib/rate-limit');
  const limiter = await strictLimiter(req);

  if (!limiter.success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429 }
    );
  }

  const authHeader = req.headers.get('authorization');

  //TODO: HMAC Signature Verification
  /*
  Nếu p2s có hỗ trợ dùng chữ kí HMAC thì nên dùng vì dùng beartoken dễ bị sniff
  */

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Authorization header not found or invalid format' },
      { status: 401 }
    );
  }
  const receivedToken = authHeader.replace('Bearer ', '').trim();
  if (receivedToken !== EXPECTED_TOKEN) {
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 403 }
    );
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON' },
      { status: 400 }
    );
  }

  if (!Array.isArray(data.transactions)) {
    return NextResponse.json(
      { success: false, message: 'Invalid payload, transactions not found' },
      { status: 400 }
    );
  }

  // Xử lý từng giao dịch
  // Import prisma
  const { prisma } = await import('@/lib/prisma');

  for (const transaction of data.transactions) {
    console.log('PAY2S WEBHOOK RECEIVED:', transaction);


    // Kiểm tra các định dạng orderNumber có thể có trong hệ thống
    // 1. ORD-YYYYMMDD-XXXXX (cũ, có dấu gạch)
    // 2. ORD<timestamp><random> (mới, không dấu gạch, format: ORD + base36 timestamp + 4 chars)
    // Ưu tiên tìm theo đúng format đã tạo trong /api/orders/route.ts
    let orderNumber: string | null = null;

    // Tìm theo format mới: ORD + alphanumeric (base36 timestamp + random)
    // Timestamp base36 có thể chứa 0-9 và A-Z
    const matchNew = transaction.content.match(/ORD[A-Z0-9]{10,20}/i);
    if (matchNew) {
      orderNumber = matchNew[0].toUpperCase();
      console.log('Tìm thấy orderNumber (format mới):', orderNumber);
    } else {
      // Fallback: Tìm theo format cũ ORD-<timestamp>
      const matchTimestamp = transaction.content.match(/ORD-\d{13}/);
      if (matchTimestamp) {
        orderNumber = matchTimestamp[0];
        console.log('Tìm thấy orderNumber (format cũ timestamp):', orderNumber);
      } else {
        // Fallback: Tìm theo format cũ ORD-YYYYMMDD-XXXXX
        const matchDate = transaction.content.match(/ORD-\d{8}-\d{5}/);
        if (matchDate) {
          orderNumber = matchDate[0];
          console.log('Tìm thấy orderNumber (format cũ date):', orderNumber);
        }
      }
    }

    if (!orderNumber) {
      console.log('Không tìm thấy mã đơn hàng trong nội dung:', transaction.content);
      continue;
    }
    console.log('Đã tách được orderNumber:', orderNumber);

    // Tìm đơn hàng theo orderNumber
    let foundOrder = await prisma.order.findUnique({ where: { orderNumber } });

    console.log('Tìm đơn hàng với orderNumber:', orderNumber);
    console.log('foundOrder:', foundOrder ? `ID: ${foundOrder.id}, Status: ${foundOrder.status}, PaymentStatus: ${foundOrder.paymentStatus}` : 'KHÔNG TÌM THẤY');

    if (!foundOrder) {
      // Đoạn này tui ko rõ để làm gì, dễ gây lỗi người này thanh toán cho người khác. nếu ông thấy ổn thì cứ để lại
      /*
      // Nếu không tìm thấy, thử tìm đơn hàng gần đúng (fuzzy search)
      console.log('Thử tìm kiếm fuzzy...');
      const fuzzyOrder = await prisma.order.findFirst({
        where: {
          orderNumber: {
            contains: orderNumber.replace('ORD-', '').replace('ORD', ''),
          },
          paymentStatus: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (fuzzyOrder) {
        console.log('Tìm thấy đơn hàng gần đúng:', fuzzyOrder.orderNumber);
        orderNumber = fuzzyOrder.orderNumber;
        foundOrder = fuzzyOrder;
      } else {
        console.log('Không tìm thấy đơn hàng PENDING nào matching:', orderNumber);

        // Debug: Hiển thị một số đơn hàng PENDING gần đây
        const recentPending = await prisma.order.findMany({
          where: { paymentStatus: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { orderNumber: true, createdAt: true, finalAmount: true }
        });
        console.log('5 đơn hàng PENDING gần đây:', recentPending);

        continue;
      }
      */
      continue;
    }

    // KIỂM TRA BẢO MẬT: Xác minh giao dịch đã được xử lý chưa
    const existingOrderWithTx = await prisma.order.findFirst({
      where: { transactionId: transaction.id.toString() }
    });
    if (existingOrderWithTx) {
      console.log(`Giao dịch ${transaction.id} đã được xử lý cho đơn ${existingOrderWithTx.orderNumber}`);
      continue;
    }

    // KIỂM TRA BẢO MẬT: Xác minh số tiền giao dịch khớp với đơn hàng
    // Pay2S trả về field là 'transferAmount'
    if (Number(foundOrder.finalAmount) !== Number(transaction.transferAmount)) {
      console.error(`Số tiền không khớp cho đơn ${orderNumber}: expected ${foundOrder.finalAmount}, got ${transaction.transferAmount}`);
      continue;
    }

    // Nếu đơn hàng chưa thanh toán, cập nhật trạng thái
    if (foundOrder.paymentStatus === 'PENDING') {
      const { generateKeyString, calculateExpirationDate } = await import('@/lib/license-key');

      // Lấy thông tin plan để thiết lập đúng maxDevices và expiresAt
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: foundOrder.planId },
      });

      if (!plan) {
        console.error('Không tìm thấy plan cho đơn hàng:', orderNumber);
        continue;
      }

      // Tính ngày hết hạn dựa trên plan
      // Use UTC timestamp to avoid timezone issues
      const now = new Date(Date.now());
      const expiresAt = calculateExpirationDate(
        plan.durationType,
        plan.durationValue,
        now
      );

      const keyString = generateKeyString();
      const licenseKey = await prisma.licenseKey.create({
        data: {
          key: keyString,
          userId: foundOrder.userId,
          planId: foundOrder.planId,
          maxDevices: plan.maxDevices, // Thiết lập đúng maxDevices từ plan
          status: 'ACTIVE',
          activatedAt: now,
          expiresAt, // Thiết lập đúng expiresAt từ plan
        },
      });

      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'COMPLETED', // Đúng enum PaymentStatus
          transactionId: transaction.id.toString(),
          paidAt: new Date(transaction.transactionDate),
          keyId: licenseKey.id,
          status: 'COMPLETED', // Đúng enum OrderStatus
        },
      });

      // Log chi tiết để dễ truy vết
      console.log('=== THANH TOÁN THÀNH CÔNG ===');
      console.log('Order Number:', orderNumber);
      console.log('Transaction ID:', transaction.id);
      console.log('Amount:', transaction.transferAmount, 'VND');
      console.log('License Key:', keyString);
      console.log('User ID:', foundOrder.userId);
      console.log('Plan:', plan.name, '(MaxDevices:', plan.maxDevices, ', Expires:', expiresAt, ')');
      console.log('Timestamp:', new Date().toISOString());
      console.log('=============================');

      // Gửi email thông báo thanh toán thành công + license key
      const { emailService } = await import('@/lib/email');
      if (foundOrder.userId) {
        const user = await prisma.user.findUnique({ where: { id: foundOrder.userId }, select: { email: true, name: true } });
        if (user?.email) {
          emailService.sendPaymentSuccessEmail(
            user.email,
            user.name ?? 'Bạn',
            orderNumber,
            plan.name,
            Number(foundOrder.finalAmount),
            foundOrder.currency || 'VND',
            keyString,
            expiresAt ?? undefined
          ).catch(err => console.error('❌ Failed to send payment email:', err));
        }
      }

    } else {
      console.log('Đơn hàng đã thanh toán hoặc trạng thái không hợp lệ:', orderNumber);
    }
  }

  return NextResponse.json(
    { success: true, message: 'Transactions processed successfully' },
    { status: 200 }
  );
}
