import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import QRCode from 'qrcode'

function TrialGate({ children }) {
  const { cafeId, cafeName } = useAuth()
  const [status, setStatus] = useState('loading')
  const [daysLeft, setDaysLeft] = useState(0)
  const [paymentQR, setPaymentQR] = useState(null)

  // your personal UPI ID for receiving payments
  const YOUR_UPI_ID = 'your_upi_id@ybl'
  const YOUR_WHATSAPP = '919876543210'

  useEffect(() => {
    if (cafeId) checkTrialStatus()
  }, [cafeId])

  async function checkTrialStatus() {
    const { data, error } = await supabase
      .from('cafes')
      .select('trial_ends_at, is_paid')
      .eq('id', cafeId)
      .single()

    if (error) {
      setStatus('active')
      return
    }

    if (data.is_paid) {
      setStatus('paid')
      return
    }

    const trialEnd = new Date(data.trial_ends_at)
    const now = new Date()
    const diff = trialEnd - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (diff > 0) {
      setDaysLeft(days)
      setStatus('trial')
      generatePaymentQR()
    } else {
      setStatus('expired')
      generatePaymentQR()
    }
  }

  async function generatePaymentQR() {
    const upiUrl = `upi://pay?pa=${YOUR_UPI_ID}&pn=DineFlow&am=999&cu=INR&tn=DineFlow Subscription`
    try {
      const qr = await QRCode.toDataURL(upiUrl, { width: 200, margin: 2 })
      setPaymentQR(qr)
    } catch (err) {
      console.error('QR error:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  // trial active — show a banner but allow access
  if (status === 'trial') {
    return (
      <>
        {/* trial banner */}
        <div className="bg-[#8B9D6A] text-white px-4 py-2 flex items-center justify-between">
          <p className="text-xs font-medium">
            🕐 Free trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
          </p>
          
            href={`https://wa.me/${YOUR_WHATSAPP}?text=Hi, I want to subscribe to DineFlow for ${cafeName}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-white text-[#8B9D6A] px-3 py-1 rounded-full font-semibold"
          >
            Subscribe ₹999/mo
          </a>
        </div>
        {children}
      </>
    )
  }

  // trial expired or paid — show paywall
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl">
              🔒
            </div>
          </div>

          {/* heading */}
          <div className="text-center mb-8">
            <h1 className="display-font text-3xl font-semibold text-gray-900 mb-2">
              Trial Ended
            </h1>
            <p className="text-gray-500 text-sm">
              Your 7-day free trial for <span className="font-semibold">{cafeName}</span> has ended.
              Subscribe to keep using DineFlow.
            </p>
          </div>

          {/* plan card */}
          <div className="bg-[#8B9D6A] rounded-3xl p-6 text-white shadow-xl mb-6">
            <div className="text-center mb-5">
              <p className="text-white/70 text-sm mb-1">Per café, per month</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">₹999</span>
                <span className="text-white/70">/month</span>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {[
                'QR menu for unlimited tables',
                'Live kitchen dashboard',
                'Owner analytics dashboard',
                'Digital bills + WhatsApp sharing',
                'UPI payment QR per order',
                'Customer ratings',
                'Menu management',
                'Staff accounts',
              ].map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs flex-shrink-0">✓</div>
                  <span className="text-sm text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* payment QR */}
          {paymentQR && (
            <div className="bg-white rounded-3xl p-5 shadow-sm mb-4 text-center">
              <p className="font-semibold text-gray-900 mb-1">Pay ₹999 to activate</p>
              <p className="text-xs text-gray-400 mb-4">
                Scan with GPay, PhonePe, Paytm or any UPI app
              </p>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100">
                  <img src={paymentQR} alt="Payment QR" className="w-48 h-48" />
                </div>
              </div>
              <p className="text-xs text-gray-400">UPI ID: {YOUR_UPI_ID}</p>
            </div>
          )}

          {/* whatsapp confirmation */}
          
            href={`https://wa.me/${YOUR_WHATSAPP}?text=Hi, I just paid ₹999 for DineFlow subscription for ${cafeName}. Please activate my account.`}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-[#25D366] text-white text-center py-4 rounded-2xl font-semibold text-sm mb-3"
          >
            📲 Send Payment Confirmation on WhatsApp
          </a>

          <p className="text-center text-xs text-gray-400">
            We'll activate your account within 2 hours of payment confirmation
          </p>
        </div>
      </div>
    )
  }

  // paid — show normally
  return children
}

export default TrialGate