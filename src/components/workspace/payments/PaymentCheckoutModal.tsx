import { useState, useEffect } from 'react';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  milestoneName: string;
  projectName?: string;
  professionalName?: string;
}

type CheckoutStage = 'CHECKOUT' | 'LOADING' | 'SANDBOX' | 'SUCCESS' | 'FAILURE';

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  milestoneName,
  projectName = 'Greenhills Villa Construction',
  professionalName = 'Alice Architect',
}: PaymentCheckoutModalProps) {
  const [stage, setStage] = useState<CheckoutStage>('CHECKOUT');
  
  // Financial breakdown calculation
  const baseAmount = amount;
  const platformFee = Math.round(baseAmount * 0.01); // 1% Platform Escrow Fee
  const gst = Math.round(platformFee * 0.18); // 18% GST on platform fee
  const totalPayable = baseAmount + platformFee + gst;

  useEffect(() => {
    if (isOpen) {
      setStage('CHECKOUT');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayClick = () => {
    setStage('LOADING');
    setTimeout(() => {
      setStage('SANDBOX');
    }, 1200);
  };

  const handleSandboxOutcome = (success: boolean) => {
    setStage('LOADING');
    setTimeout(() => {
      if (success) {
        setStage('SUCCESS');
      } else {
        setStage('FAILURE');
      }
    }, 1000);
  };

  const handleFinalSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-stone-150 animate-in fade-in zoom-in-95 duration-200 text-left text-xs font-semibold text-stone-700">
        
        {/* Close Icon (Only visible in checkout/success/failure stages) */}
        {(stage === 'CHECKOUT' || stage === 'SUCCESS' || stage === 'FAILURE') && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-7 w-7 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* 1. CHECKOUT SUMMARY STAGE */}
        {stage === 'CHECKOUT' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Secure Escrow Checkout
              </span>
              <h2 className="text-xl font-bold text-stone-900 font-serif leading-tight mt-3">
                Project Milestone Payment
              </h2>
              <p className="text-[10px] text-stone-400 font-medium">
                Verify milestone billing coordinates before triggering payment.
              </p>
            </div>

            {/* Project Context Summary */}
            <div className="p-4 bg-stone-50 border border-stone-200/60 rounded-2xl space-y-2">
              <span className="block text-[8px] font-black text-stone-400 uppercase tracking-wider">Project Coordinates</span>
              <div>
                <strong className="text-stone-900 text-[13px] font-bold block truncate">{projectName}</strong>
                <span className="text-[10.5px] text-stone-500 font-semibold block mt-0.5">Specialist: {professionalName}</span>
              </div>
              <div className="pt-2 border-t border-stone-200/40 text-[10.5px] text-stone-600 font-medium">
                🎯 <strong>Milestone Target:</strong> "{milestoneName}"
              </div>
            </div>

            {/* Payment Summary Breakdown */}
            <div className="space-y-3">
              <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest">Pricing Ledger</span>
              
              <div className="space-y-2 font-semibold">
                <div className="flex justify-between text-stone-600">
                  <span>Milestone Value</span>
                  <strong className="text-stone-900">₹{baseAmount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>DBC Escrow Verification Fee (1%)</span>
                  <strong className="text-stone-900">₹{platformFee.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-stone-600 pb-2.5">
                  <span>GST on Escrow Fee (18%)</span>
                  <strong className="text-stone-900">₹{gst.toLocaleString()}</strong>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-stone-200 text-sm font-bold text-stone-900">
                  <span>Total Payable Amount</span>
                  <span className="text-xl font-extrabold text-emerald-800 font-serif">
                    ₹{totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Messaging */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
              <span className="text-emerald-700 text-sm mt-0.5">🛡️</span>
              <p className="text-[10px] text-emerald-800 leading-relaxed font-semibold">
                <strong>DBC Escrow Assurance:</strong> Funds are locked securely and only released to the professional upon your final milestone completion sign-off.
              </p>
            </div>

            {/* CTA action */}
            <button
              onClick={handlePayClick}
              className="w-full dbc-btn dbc-btn-xl dbc-btn-primary"
            >
              Pay ₹{totalPayable.toLocaleString()}
            </button>
          </div>
        )}

        {/* 2. LOADING SECURE GATEWAY CONNECTION STAGE */}
        {stage === 'LOADING' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin"></div>
            <div className="space-y-1">
              <strong className="text-xs font-black uppercase text-stone-900 tracking-wider block">Preparing Secure Checkout...</strong>
              <p className="text-[10px] text-stone-400 font-medium">Establishing connection to Sandbox Payment Gateway</p>
            </div>
          </div>
        )}

        {/* 3. MOCK GATEWAY SANDBOX SELECTION STAGE */}
        {stage === 'SANDBOX' && (
          <div className="space-y-5 text-center">
            <div className="space-y-1 py-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                Sandbox Mode
              </span>
              <h2 className="text-base font-bold text-stone-900 font-serif mt-3">
                Simulated Payment Gateway
              </h2>
              <p className="text-[10px] text-stone-500 max-w-xs mx-auto leading-relaxed">
                Select a payment outcome. In production, this launches Razorpay's overlay screen.
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-1.5 font-sans">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-500">Gateway Order:</span>
                <strong className="text-stone-900 font-mono">ORD-{Date.now().toString().slice(-6)}</strong>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-500">Payable Amount:</span>
                <strong className="text-stone-900">₹{totalPayable.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleSandboxOutcome(true)}
                className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Simulate Payment Success
              </button>
              <button
                onClick={() => handleSandboxOutcome(false)}
                className="w-full dbc-btn dbc-btn-md dbc-btn-danger border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                Simulate Payment Failure
              </button>
            </div>
          </div>
        )}

        {/* 4. PAYMENT SUCCESS STAGE */}
        {stage === 'SUCCESS' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center pt-2">
              <span className="w-12 h-12 flex items-center justify-center bg-emerald-55/15 text-emerald-800 border border-emerald-300 rounded-full font-bold text-xl">
                ✓
              </span>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900 font-serif">Payment Successful</h2>
              <p className="text-[10px] text-stone-500 font-semibold">
                Milestone funds locked securely in DBC Escrow.
              </p>
            </div>

            {/* Receipt Summary details */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-left text-[11px] space-y-2 font-sans font-semibold">
              <div className="flex justify-between border-b border-stone-200/55 pb-1.5">
                <span className="text-stone-400 uppercase text-[8px] tracking-wider font-bold">Transaction Reference</span>
                <strong className="text-stone-900 font-mono">TXN-RZP-{Date.now().toString().slice(-8)}</strong>
              </div>
              <div className="flex justify-between border-b border-stone-200/55 pb-1.5">
                <span className="text-stone-400 uppercase text-[8px] tracking-wider font-bold">Payment Target</span>
                <strong className="text-stone-900 truncate max-w-[180px]">{milestoneName}</strong>
              </div>
              <div className="flex justify-between border-b border-stone-200/55 pb-1.5">
                <span className="text-stone-400 uppercase text-[8px] tracking-wider font-bold">Total Paid</span>
                <strong className="text-stone-900">₹{totalPayable.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 uppercase text-[8px] tracking-wider font-bold">Billing Date</span>
                <strong className="text-stone-900">{new Date().toLocaleDateString('en-IN')}</strong>
              </div>
            </div>

            <button
              onClick={handleFinalSuccess}
              className="w-full dbc-btn dbc-btn-xl dbc-btn-primary"
            >
              Return to Workspace
            </button>
          </div>
        )}

        {/* 5. PAYMENT FAILURE STAGE */}
        {stage === 'FAILURE' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center pt-2">
              <span className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-lg font-serif">
                ✕
              </span>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900 font-serif">Payment Failed</h2>
              <p className="text-[10.5px] text-stone-500 font-semibold leading-relaxed max-w-[280px] mx-auto">
                The transaction could not be completed. Your account has not been charged.
              </p>
            </div>

            <div className="flex gap-3 pt-2 text-[10px] font-black uppercase tracking-wider">
              <button
                onClick={() => setStage('CHECKOUT')}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
