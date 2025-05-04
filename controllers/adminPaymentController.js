import { PaymentRequest } from '../models/paymentModel.js';


//Get all payment request
export const getAllPaymentRequests = async (req, res) => {
    try {
        const { status } = req.query;

        const query = status ? { status } : {};

        const paymentRequests = await PaymentRequest.find(query)
            .populate('volunteer', 'name email registrationNumber')
            .populate('approvals.admin', 'name email')
            .sort({ requestDate: -1 });

        return res.status(200).json({
            success: true,
            count: paymentRequests.length,
            paymentRequests
        });
    } catch (error) {
        console.error('Error fetching payment requests:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payment requests',
            error: error.message
        });
    }
};





//Approve payment
export const approvePaymentRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.admin.id;

        const paymentRequest = await PaymentRequest.findById(requestId);

        if (!paymentRequest) {
            return res.status(404).json({ message: 'Payment request not found' });
        }

        const alreadyApproved = paymentRequest.approvals.some(
            approval => approval.admin.toString() === adminId
        );

        if (alreadyApproved) {
            return res.status(400).json({
                success: false,
                message: 'You have already approved this request'
            });
        }

        paymentRequest.approvals.push({ admin: adminId });

        if (paymentRequest.approvals.length >= 3 && paymentRequest.status === 'pending') {
            paymentRequest.status = 'approved';
        }

        await paymentRequest.save();

        return res.status(200).json({
            success: true,
            message: paymentRequest.status === 'approved'
                ? 'Payment request has been approved with required approvals'
                : `Payment request approval recorded (${paymentRequest.approvals.length}/3 approvals)`,
            paymentRequest
        });
    } catch (error) {
        console.error('Error approving payment request:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve payment request',
            error: error.message
        });
    }
};





//Reject payment
export const rejectPaymentRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.admin.id;

        const paymentRequest = await PaymentRequest.findById(requestId);

        if (!paymentRequest) {
            return res.status(404).json({ message: 'Payment request not found' });
        }

        if (paymentRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject request with status: ${paymentRequest.status}`
            });
        }

        paymentRequest.status = 'rejected';
        if (req.body.rejectionReason) {
            paymentRequest.rejectionReason = req.body.rejectionReason;
        }

        await paymentRequest.save();

        return res.status(200).json({
            success: true,
            message: 'Payment request has been rejected',
            paymentRequest
        });
    } catch (error) {
        console.error('Error rejecting payment request:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject payment request',
            error: error.message
        });
    }
};





//Mark paid
export const markAsPaid = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { razorpayPaymentId, razorpayOrderId } = req.body;

        const paymentRequest = await PaymentRequest.findById(requestId);

        if (!paymentRequest) {
            return res.status(404).json({ message: 'Payment request not found' });
        }

        if (paymentRequest.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Only approved payment requests can be marked as paid'
            });
        }

        paymentRequest.status = 'paid';
        paymentRequest.razorpayPaymentId = razorpayPaymentId;
        paymentRequest.razorpayOrderId = razorpayOrderId;
        paymentRequest.paymentDate = Date.now();

        await paymentRequest.save();

        return res.status(200).json({
            success: true,
            message: 'Payment request has been marked as paid',
            paymentRequest
        });
    } catch (error) {
        console.error('Error marking payment as paid:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark payment as paid',
            error: error.message
        });
    }
};