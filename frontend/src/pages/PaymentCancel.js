import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowRight } from 'lucide-react';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-red-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="bg-[#0A0A0A] border border-red-500/20 rounded-2xl p-10 backdrop-blur-xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Payment Cancelled</h1>
          <p className="text-slate-500 text-sm font-mono mb-8">
            Your payment was cancelled. No charges were made.
          </p>
          
          <div className="space-y-4">
            <Link
              to="/portal/orders"
              className="btn-primary w-full flex items-center justify-center gap-3"
              data-testid="back-to-orders-btn"
            >
              Back to Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="btn-secondary w-full flex items-center justify-center gap-3"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
