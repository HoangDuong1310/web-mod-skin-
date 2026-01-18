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

    // Ví dụ: kiểm tra nội dung chuyển khoản có mã đơn hàng (orderNumber)
    const match = transaction.content.match(/ORD\d+/);
    const orderNumber = match ? match[0] : null;
    if (!orderNumber) {
      console.log('Không tìm thấy mã đơn hàng trong nội dung:', transaction.content);
      continue;
    }

    // Tìm đơn hàng theo orderNumber
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) {
      console.log('Không tìm thấy đơn hàng:', orderNumber);
      continue;
    }

    // Nếu đơn hàng chưa thanh toán, cập nhật trạng thái
    if (order.paymentStatus === 'PENDING') {
      // Tạo license key mới
      const { generateKeyString } = await import('@/lib/license-key');
      const keyString = generateKeyString();
      // Tạo bản ghi key
      const licenseKey = await prisma.licenseKey.create({
        data: {
          key: keyString,
          userId: order.userId,
          planId: order.planId,
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });

      // Gán key cho đơn hàng
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'PAID',
          transactionId: transaction.id.toString(),
          paidAt: new Date(transaction.transactionDate),
          keyId: licenseKey.id,
          status: 'COMPLETED',
        },
      });

      console.log('Đã xác nhận thanh toán và cấp key cho đơn:', orderNumber, 'Key:', keyString);
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
