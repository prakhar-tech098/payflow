import { useState, useEffect } from "react";
import api from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { jsPDF } from "jspdf";
import { Download, CreditCard, Mail, Bell, Link as LinkIcon } from "lucide-react";
import { toast } from 'sonner';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, price: 0 }]);

  const fetchData = async () => {
    try {
      const [invRes, custRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/customers")
      ]);
      setInvoices(invRes.data);
      setCustomers(custRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = () => items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, price: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerId,
        dueDate,
        items: items.map(i => ({ ...i, total: i.quantity * i.price })),
        totalAmount: calculateTotal(),
        status: "Draft"
      };
      await api.post("/invoices", payload);
      toast.success("Invoice created successfully!");
      setIsOpen(false);
      fetchData();
      // Reset form
      setCustomerId("");
      setDueDate("");
      setItems([{ description: "", quantity: 1, price: 0 }]);
    } catch (error) {
      toast.error("Failed to create invoice.");
      console.error("Failed to create invoice", error);
    }
  };

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${invoice._id}`, 20, 40);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 50);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 60);
    doc.text(`Status: ${invoice.status}`, 20, 70);
    
    doc.text("Bill To:", 20, 90);
    doc.text(`Name: ${invoice.customerId?.name || 'N/A'}`, 20, 100);
    doc.text(`Email: ${invoice.customerId?.email || 'N/A'}`, 20, 110);
    
    let yPos = 130;
    doc.text("Description", 20, yPos);
    doc.text("Qty", 120, yPos);
    doc.text("Price", 150, yPos);
    doc.text("Total", 180, yPos);
    
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 10;
    
    invoice.items.forEach(item => {
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`Rs ${item.price.toFixed(2)}`, 150, yPos);
      doc.text(`Rs ${item.total.toFixed(2)}`, 180, yPos);
      yPos += 10;
    });
    
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFontSize(14);
    doc.text(`Total Amount: Rs ${invoice.totalAmount.toFixed(2)}`, 130, yPos);
    
    doc.save(`invoice_${invoice._id}.pdf`);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (invoice) => {
    if (invoice.status === 'Paid') return;

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Failed to load Razorpay. Check your connection.");
      return;
    }

    try {
      const { data: order } = await api.post("/payment/create-order", { invoiceId: invoice._id });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "placeholder_key_id",
        amount: order.amount,
        currency: "INR",
        name: "PayFlow Invoicing",
        description: `Payment for Invoice ${invoice._id.substring(18)}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              invoiceId: invoice._id
            });
            toast.success("Payment Successful!");
            fetchData();
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

  const handleEmail = async (invoice) => {
    try {
      const promise = api.post(`/invoices/${invoice._id}/send`).then(() => fetchData());
      toast.promise(promise, {
        loading: `Sending invoice to ${invoice.customerId?.email}...`,
        success: 'Email sent successfully!',
        error: 'Failed to send email. Ensure Nodemailer is configured.',
      });
    } catch (error) {
      console.error("Failed to handle email", error);
    }
  };

  const handleRemind = async (invoice) => {
    try {
      const promise = api.post(`/invoices/${invoice._id}/remind`);
      toast.promise(promise, {
        loading: `Sending reminder to ${invoice.customerId?.email}...`,
        success: 'Reminder sent successfully!',
        error: 'Failed to send reminder.',
      });
    } catch (error) {
      console.error("Failed to handle reminder", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Create and manage your invoices.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c._id} value={c._id}>{c.name} ({c.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>Add Item</Button>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end bg-muted/50 p-3 rounded-md">
                    <div className="flex-1 space-y-2">
                      <Label>Description</Label>
                      <Input value={item.description} required onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Qty</Label>
                      <Input type="number" min="1" value={item.quantity} required onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Price</Label>
                      <Input type="number" min="0" step="0.01" value={item.price} required onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))} />
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                      X
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end text-xl font-bold">
                Total: ₹{calculateTotal().toFixed(2)}
              </div>

              <DialogFooter>
                <Button type="submit">Create Invoice</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv._id}>
                <TableCell className="font-mono text-xs">{inv._id.substring(18)}</TableCell>
                <TableCell>{inv.customerId?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-right font-medium">₹{inv.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {inv.status !== 'Paid' && (
                    <Button variant="outline" size="sm" onClick={() => handlePayment(inv)} className="mr-2">
                      <CreditCard className="w-4 h-4 mr-2" /> Pay
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEmail(inv)} className="mr-2">
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/pay/${inv._id}`);
                    toast.success("Payment link copied!");
                  }} className="mr-2">
                    <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
                  </Button>
                  {inv.status !== 'Paid' && (
                    <Button variant="outline" size="sm" onClick={() => handleRemind(inv)} className="mr-2">
                      <Bell className="w-4 h-4 mr-2" /> Remind
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => generatePDF(inv)}>
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Invoices;
