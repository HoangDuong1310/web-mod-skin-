import { NextRequest, NextResponse } from 'next/server';

const EXPECTED_TOKEN = process.env.PAY2S_WEBHOOK_TOKEN || 'your_expected_token_here';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
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
    // 1. ORD-YYYYMMDD-XXXXX
    // 2. ORD-<timestamp> (ORD-1700000000000)
    // 3. ORDxxxxxx (ORD1768687670263)
    // Ưu tiên tìm theo đúng format đã tạo trong /api/orders/route.ts
    let orderNumber: string | null = null;
    // Tìm theo ORD-<timestamp>
    const matchTimestamp = transaction.content.match(/ORD-\d{13}/);
    if (matchTimestamp) {
      orderNumber = matchTimestamp[0];
    } else {
      // Tìm theo ORD-YYYYMMDD-XXXXX
      const matchDate = transaction.content.match(/ORD-\d{8}-\d{5}/);
      if (matchDate) {
        orderNumber = matchDate[0];
      } else {
        // Tìm theo ORD\d+
        const matchSimple = transaction.content.match(/ORD\d+/);
        if (matchSimple) {
          orderNumber = matchSimple[0];
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
    if (!foundOrder) {
      // Nếu không tìm thấy, thử tìm đơn hàng có orderNumber chứa trong content (fuzzy)
      const fuzzyOrder = await prisma.order.findFirst({
        where: {
          orderNumber: {
            contains: orderNumber.replace('ORD-', '').replace('ORD', ''),
          },
          paymentStatus: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!fuzzyOrder) {
        console.log('Không tìm thấy đơn hàng:', orderNumber);
        continue;
      }
      console.log('Tìm thấy đơn hàng gần đúng:', fuzzyOrder.orderNumber);
      orderNumber = fuzzyOrder.orderNumber;
      foundOrder = fuzzyOrder;
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
    if (Number(foundOrder.finalAmount) !== Number(transaction.amount)) {
      console.error(`Số tiền không khớp cho đơn ${orderNumber}: expected ${foundOrder.finalAmount}, got ${transaction.amount}`);
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
      const expiresAt = calculateExpirationDate(
        plan.durationType,
        plan.durationValue,
        new Date()
      );

      const keyString = generateKeyString();
      const licenseKey = await prisma.licenseKey.create({
        data: {
          key: keyString,
          userId: foundOrder.userId,
          planId: foundOrder.planId,
          maxDevices: plan.maxDevices, // Thiết lập đúng maxDevices từ plan
          status: 'ACTIVE',
          activatedAt: new Date(),
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
      console.log('Amount:', transaction.amount, 'VND');
      console.log('License Key:', keyString);
      console.log('User ID:', foundOrder.userId);
      console.log('Plan:', plan.name, '(MaxDevices:', plan.maxDevices, ', Expires:', expiresAt, ')');
      console.log('Timestamp:', new Date().toISOString());
      console.log('=============================');

      // TODO: Gửi email hoặc thông báo cho user nếu cần
    } else {
      console.log('Đơn hàng đã thanh toán hoặc trạng thái không hợp lệ:', orderNumber);
    }
  }

  return NextResponse.json(
    { success: true, message: 'Transactions processed successfully' },
    { status: 200 }
  );
}
