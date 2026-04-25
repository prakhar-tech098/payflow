import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PublicCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/invoices/public/${id}`);
        setInvoice(data);
      } catch (error) {
        toast.error("Invoice not found or invalid link.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (invoice.status === 'Paid') {
      toast.info("This invoice is already paid.");
      return;
    }

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Failed to load Razorpay. Check your connection.");
      return;
    }

    try {
      const { data: order } = await axios.post(`${import.meta.env.VITE_API_URL}/payment/create-order`, { invoiceId: invoice._id });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "placeholder_key_id",
        amount: order.amount,
        currency: "INR",
        name: invoice.userId?.businessDetails?.businessName || invoice.userId?.name || "PayFlow",
        description: `Payment for Invoice ${invoice._id.substring(18)}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(`${import.meta.env.VITE_API_URL}/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice._id
            });
            toast.success("Payment Successful!");
            setInvoice(prev => ({ ...prev, status: 'Paid' }));
          } catch (error) {
            console.error("Verification failed", error);
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: invoice.customerId?.name || "",
          email: invoice.customerId?.email || "",
          contact: invoice.customerId?.phone || ""
        },
        theme: {
          color: "#0f172a"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Failed to initiate payment", error);
      toast.error("Could not start payment process.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <h1 className="text-4xl font-bold mb-4">Invoice Not Found</h1>
        <p className="text-slate-400">The invoice you are looking for does not exist or the link is invalid.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 p-4">
      {/* Background Gradients */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px]" 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl z-10"
      >
        <Card className="w-full shadow-2xl border-white/10 bg-black/50 backdrop-blur-xl">
          <CardHeader className="text-center pb-8 border-b border-white/10">
            <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {invoice.userId?.businessDetails?.businessName || invoice.userId?.name || 'PayFlow Invoice'}
            </CardTitle>
            <CardDescription className="text-slate-400 text-base mt-2">
              Invoice #{invoice._id.substring(18).toUpperCase()}
            </CardDescription>
            {invoice.status === 'Paid' && (
              <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Payment Completed
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-8 space-y-8 text-slate-300">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <h4 className="text-slate-500 mb-2 font-medium">Billed To</h4>
                <p className="font-semibold text-slate-200">{invoice.customerId?.name}</p>
                <p>{invoice.customerId?.email}</p>
                <p>{invoice.customerId?.address}</p>
              </div>
              <div className="text-right">
                <h4 className="text-slate-500 mb-2 font-medium">Invoice Details</h4>
                <p><span className="text-slate-500">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p><span className="text-slate-500">Due:</span> <span className="font-semibold text-slate-200">{new Date(invoice.dueDate).toLocaleDateString()}</span></p>
              </div>
            </div>

            <div>
              <h4 className="text-slate-500 mb-4 font-medium border-b border-white/5 pb-2">Line Items</h4>
              <div className="space-y-4">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-slate-200">{item.description}</p>
                      <p className="text-slate-500">Qty: {item.quantity} x ₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="font-medium">
                      ₹{item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/10">
              <span className="text-lg font-medium text-slate-400">Total Due</span>
              <span className="text-3xl font-bold text-white">₹{invoice.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="pt-6 pb-8 px-6 bg-white/5">
            {invoice.status !== 'Paid' ? (
              <Button 
                onClick={handlePayment} 
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold shadow-lg transition-all"
              >
                Pay Securely Now
              </Button>
            ) : (
              <Button 
                disabled 
                className="w-full h-14 text-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              >
                Invoice Settled
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default PublicCheckout;
