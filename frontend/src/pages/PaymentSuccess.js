import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Crown } from 'lucide-react';
import api from '../api/client';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const pollStatus = async (attempts = 0) => {
      const maxAttempts = 5;
      const pollInterval = 2000;

      if (attempts >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const result = await api.getCheckoutStatus(sessionId);
        setPaymentInfo(result);

        if (result.payment_status === 'paid') {
          setStatus('success');
          toast.success('Payment confirmed!');
          return;
        } else if (result.status === 'expired') {
          setStatus('expired');
          return;
        }

        setTimeout(() => pollStatus(attempts + 1), pollInterval);
      } catch (error) {
        console.error('Error checking status:', error);
        if (attempts < maxAttempts - 1) {
          setTimeout(() => pollStatus(attempts + 1), pollInterval);
        } else {
          setStatus('error');
        }
      }
    };

    if (!sessionId) {
      setStatus('error');
    } else {
      pollStatus();
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-green-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="bg-[#0A0A0A] border border-green-500/20 rounded-2xl p-10 backdrop-blur-xl">
          {status === 'checking' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Processing Payment</h1>
              <p className="text-slate-500 text-sm font-mono">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Payment Successful</h1>
              <p className="text-slate-500 text-sm font-mono mb-6">Thank you for your purchase!</p>
              {paymentInfo && (
                <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${paymentInfo.amount_total?.toFixed(2)} {paymentInfo.currency?.toUpperCase()}
                  </p>
                </div>
              )}
              <Link
                to="/portal/orders"
                className="btn-primary w-full flex items-center justify-center gap-3"
                data-testid="view-orders-btn"
              >
                View Your Orders
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {(status === 'error' || status === 'timeout') && (
            <>
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Unable to Verify</h1>
              <p className="text-slate-500 text-sm font-mono mb-6">
                We couldn&apos;t verify your payment status. Please check your email for confirmation.
              </p>
              <Link
                to="/portal"
                className="btn-secondary w-full flex items-center justify-center gap-3"
              >
                Go to Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <Crown className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Session Expired</h1>
              <p className="text-slate-500 text-sm font-mono mb-6">
                Your payment session has expired. Please try again.
              </p>
              <Link
                to="/portal/orders"
                className="btn-secondary w-full flex items-center justify-center gap-3"
              >
                View Orders
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
