import React, { useState, FormEvent } from "react";
import { X, Check, Loader2, ArrowRight, AlertTriangle, FileDown } from "lucide-react";
import { PhoneProduct } from "../../types";
import { jsPDF } from "jspdf";

interface CheckoutModalProps {
  product: PhoneProduct;
  selectedColor: string;
  buyType: "Direct" | "EMI";
  emiDetails?: {
    tenure: number;
    downpayment: number;
    monthly: number;
  };
  onClose: () => void;
  onOrderSuccess: () => void;
}

export default function CheckoutModal({
  product,
  selectedColor,
  buyType,
  emiDetails,
  onClose,
  onOrderSuccess
}: CheckoutModalProps) {
  // Customer Form state
  const [customerName, setCustomerName] = useState("");
  const [dialCode, setDialCode] = useState("+977");
  const [customerContact, setCustomerContact] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Interaction states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate pricing values
  const totalCost = product.price;

  // Standard checkout place order (Cash on Delivery / Booking Reservation)
  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerName.trim()) {
      return setValidationError("Please enter your complete Name.");
    }
    const cleanNum = customerContact.trim();
    if (!cleanNum || cleanNum.length < 8) {
      return setValidationError("Please provide a valid Contact Phone Number (at least 8 digits).");
    }
    if (!customerAddress.trim()) {
      return setValidationError("Please type in your full shipping/landmark Address.");
    }

    setSubmitLoading(true);

    const fullContact = `${dialCode} ${cleanNum}`;

    const bookingNote = buyType === "EMI" && emiDetails
      ? `Requested 0% Interest EMI plan over ${emiDetails.tenure} months (Downpayment: NRs. ${emiDetails.downpayment.toLocaleString()}, Monthly: NRs. ${emiDetails.monthly.toLocaleString()})`
      : `Requested Direct Outright Booking purchase for NRs. ${product.price.toLocaleString()}`;

    try {
      const payload = {
        customerName: customerName.trim(),
        customerContact: fullContact,
        customerAddress: customerAddress.trim(),
        brand: product.brand,
        model: product.model,
        buyType,
        totalPrice: product.price,
        emiTenure: emiDetails?.tenure || null,
        emiDownpayment: emiDetails?.downpayment || 0,
        emiMonthly: emiDetails?.monthly || 0,
        emiPaidMonths: 0,
        selectedColor,
        notes: bookingNote,
        paymentMethod: "Outright/EMI Booking Reservation",
        paymentStatus: "Pending"
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const responseData = await res.json();
        setCustomerContact(fullContact); // Save combined contact format to show in success UI
        setOrderId(responseData.order?.id || "ORDER-SUCCESS");
      } else {
        setValidationError("The server encountered an issue recording your order. Please retry.");
      }
    } catch (err) {
      setValidationError("Failed connecting to order database. Try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadReceiptPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Header bar with crimson theme accent
    doc.setFillColor(74, 6, 5); // Crimson brand color
    doc.rect(0, 0, 210, 36, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("RIAAN KO PASAL", 20, 16);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    doc.text("Smart Phone & Appliance Store - Rupandehi, Nepal", 20, 22);
    doc.text("RESERVATION BOOKING RECEIPT", 20, 28);

    // Metadata Right-aligned
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Date: " + new Date().toLocaleDateString(), 145, 16);
    doc.setFont("helvetica", "normal");
    doc.text("Reference ID: " + (orderId || "N/A"), 145, 22);
    
    // Status box
    doc.setFillColor(254, 243, 199); // amber-100
    doc.rect(145, 25, 45, 6, "F");
    doc.setTextColor(146, 64, 14); // amber-800
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("AWAITING VERIFICATION", 147.5, 29.2);

    // Customer Information Section
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER INFORMATION", 20, 52);
    
    // Underline
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(20, 54, 190, 54);

    // Grid details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Customer Name:", 20, 62);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(customerName, 55, 62);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Contact Number:", 20, 69);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(customerContact, 55, 69);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Delivery Address:", 20, 76);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    const addressLines = doc.splitTextToSize(customerAddress, 130);
    doc.text(addressLines, 55, 76);

    const addressOffset = (addressLines.length - 1) * 5.5;

    // Reservation summary section
    const yReserveStart = 87 + addressOffset;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("RESERVATION SUMMARY", 20, yReserveStart);
    doc.line(20, yReserveStart + 2, 190, yReserveStart + 2);

    // Table header block
    const yTableStart = yReserveStart + 10;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(20, yTableStart, 170, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Item / Description", 24, yTableStart + 5.5);
    doc.text("Color Option", 90, yTableStart + 5.5);
    doc.text("Purchase Type", 125, yTableStart + 5.5);
    doc.text("Total Cost", 160, yTableStart + 5.5);

    // Table row
    const yRow = yTableStart + 8;
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, yRow, 170, 14, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${product.brand} ${product.model}`, 24, yRow + 8.5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(selectedColor, 90, yRow + 8.5);
    doc.text(buyType === "EMI" ? "0% Interest EMI" : "Direct Purchase", 125, yRow + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(74, 6, 5); // Crimson
    doc.text("NRs. " + product.price.toLocaleString(), 160, yRow + 8.5);

    let yNext = yRow + 22;

    // If EMI is chosen, print the tenure details nicely
    if (buyType === "EMI" && emiDetails) {
      doc.setFillColor(254, 252, 232); // amber-50
      doc.rect(20, yNext, 170, 24, "F");
      doc.setDrawColor(253, 224, 71); // amber-300
      doc.rect(20, yNext, 170, 24, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(133, 77, 14); // amber-800
      doc.text("REQUESTED 0% INTEREST EMI PLAN DETAILS", 25, yNext + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(113, 63, 18);
      doc.text(`EMI Tenure: ${emiDetails.tenure} Months`, 25, yNext + 13);
      doc.text(`Downpayment: NRs. ${emiDetails.downpayment.toLocaleString()}`, 25, yNext + 19);
      doc.text(`Monthly Installment: NRs. ${emiDetails.monthly.toLocaleString()} / month`, 105, yNext + 19);

      yNext += 32;
    }

    // What happens next card
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yNext, 170, 26, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, yNext, 170, 26, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("WHAT HAPPENS NEXT?", 25, yNext + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const steps = [
      "1. Your reservation booking request is Notified to the shop.",
      "2. Store person will reach out to you at " + customerContact + ".",
      "3. Product dispatch and shipping schedules will be arranged accordingly."
    ];
    doc.text(steps[0], 25, yNext + 12);
    doc.text(steps[1], 25, yNext + 17);
    doc.text(steps[2], 25, yNext + 22);

    // Bottom note
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for choosing Riaan Ko Pasal. This is an official computer-generated reservation document.", 105, yNext + 36, { align: "center" });

    // Save document
    doc.save(`RiaanKoPasal-Booking-${orderId || "Receipt"}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-inner" id="checkout-modal">
      <div className="relative bg-white max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-150 z-10 p-6 sm:p-8 my-8 animate-fadeIn">
        
        {/* Header absolute close button */}
        {!orderId && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-950 bg-gray-50 hover:bg-gray-150 rounded-full transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* State A: Complete checkmark display after booking successfully recorded */}
        {orderId ? (
          <div className="text-center py-6 space-y-5" id="checkout-success-view">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100 animate-pulse">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-sans text-emerald-700 font-semibold bg-emerald-50/80 border border-emerald-150/40 px-3.5 py-1.5 rounded-full block max-w-sm mx-auto leading-relaxed">
                Booking Done. Now, wait for the verification call. Store will contact you in <span className="font-bold font-mono text-emerald-950">{customerContact}</span>.
              </span>
              <h2 className="font-display font-bold text-gray-900 text-xl uppercase tracking-tight pt-2">
                Reservation Completed!
              </h2>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                Reference ID: <span className="font-bold text-gray-800">{orderId}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-xs text-gray-600 space-y-3 font-sans">
              <div className="border-b border-gray-200/50 pb-2 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase">Product Spec</span>
                  <strong className="text-gray-950 text-xs font-semibold uppercase">{product.brand} {product.model} ({selectedColor})</strong>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 block uppercase font-mono">Total Cost</span>
                  <strong className="text-[#4a0605] text-xs font-bold font-mono">NRs. {product.price.toLocaleString()}</strong>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[9px] text-gray-400 block uppercase font-mono">Booking details</span>
                <div className="flex flex-col space-y-1 bg-white border border-gray-150/40 p-2.5 rounded-lg text-xs font-sans text-gray-700">
                  <div>Name: <span className="font-medium text-gray-950">{customerName}</span></div>
                  <div>Contact: <span className="font-medium text-gray-950 font-mono">{customerContact}</span></div>
                  <div>Address: <span className="font-medium text-gray-950">{customerAddress}</span></div>
                  <div>Status: <span className="font-bold text-amber-700">Awaiting Owner Verification</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={downloadReceiptPDF}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-semibold tracking-wider text-xs uppercase rounded-full transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center justify-center space-x-2 cursor-pointer select-none border border-emerald-500 shadow-md hover:shadow-lg"
              >
                <FileDown className="w-4 h-4 text-emerald-100" />
                <span>Download Receipt (PDF)</span>
              </button>

              <button
                onClick={onOrderSuccess}
                className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-display font-medium tracking-widest text-xs uppercase rounded-full transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center justify-center space-x-1 cursor-pointer select-none"
              >
                <span>Back to Showcase Catalog</span>
              </button>
            </div>
          </div>
        ) : (
          /* State B: Simple Booking Form */
          <div className="space-y-4">
            {/* Error alerts */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-lg text-left animate-pulse flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleOrderSubmit} className="space-y-4 text-left font-sans" id="checkout-form-simple">
              <div className="space-y-1">
                <h2 className="font-display font-extrabold text-[#4a0605] text-lg uppercase tracking-wider">
                  Reserve Appliance Package
                </h2>
              </div>

              {/* Short items summary card */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 flex items-center space-x-3 max-w-full">
                <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-150 flex-shrink-0 w-11 h-11 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={`${product.brand} ${product.model}`}
                    className="max-w-full max-h-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-xs font-sans truncate flex-1 leading-tight">
                  <strong className="text-gray-900 font-bold block uppercase truncate">{product.brand} {product.model}</strong>
                  <span className="text-gray-400 text-[10px] block font-mono">
                    Color: {selectedColor} | Path: {buyType === "EMI" ? `${emiDetails?.tenure}m 0% Interest EMI` : "Outright purchase"}
                  </span>
                </div>
                <div className="text-right font-display whitespace-nowrap bg-white py-1 px-2.5 rounded-lg border border-gray-150 shadow-xs">
                  <span className="text-[10px] text-gray-405 block font-mono uppercase">Appliance price</span>
                  <span className="text-xs font-black text-[#4a0605] font-mono">NRs. {totalCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                {/* Field 1: Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600" htmlFor="guest-name">
                    Full Booking Name (English / नेपाली)
                  </label>
                  <input
                    type="text"
                    id="guest-name"
                    placeholder="e.g. Ram Prasad Adhikari"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-55/40 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all"
                    required
                  />
                </div>

                {/* Field 2: Contact Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600" htmlFor="guest-phone">
                    Mobile Contact Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      className="px-3 py-2.5 bg-gray-55/40 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all font-mono font-bold shrink-0 cursor-pointer"
                    >
                      <option value="+977">🇳🇵 +977 (Nepal)</option>
                      <option value="+91">🇮🇳 +91 (India)</option>
                      <option value="+1">🇺🇸 +1 (USA/Canada)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+971">🇦🇪 +971 (UAE)</option>
                      <option value="+974">🇶🇦 +974 (Qatar)</option>
                      <option value="+60">🇲🇾 +60 (Malaysia)</option>
                      <option value="+966">🇸🇦 +966 (Saudi Arabia)</option>
                      <option value="+61">🇦🇺 +61 (Australia)</option>
                      <option value="+81">🇯🇵 +81 (Japan)</option>
                    </select>
                    <input
                      type="tel"
                      id="guest-phone"
                      placeholder="e.g. 98570XXXXX"
                      value={customerContact}
                      onChange={(e) => {
                        const cleanValue = e.target.value.replace(/\D/g, "");
                        setCustomerContact(cleanValue);
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-gray-55/40 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Field 3: Shipping Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600" htmlFor="guest-address">
                    Shipping/Landmark Ward Address
                  </label>
                  <textarea
                    id="guest-address"
                    rows={2}
                    placeholder="e.g. Thutipipal Ward 1, Omsatiya Rural Municipality, Rupandehi"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-55/40 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all resize-none leading-snug"
                    required
                  />
                </div>
              </div>

              {/* Checkout actions */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-800 font-display font-semibold tracking-wider text-[11px] uppercase hover:bg-gray-50 rounded-full transition-all select-none cursor-pointer text-center"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-2/3 py-2.5 bg-[#4a0605] hover:bg-[#340202] text-white font-display font-bold tracking-wider text-[11px] uppercase flex items-center justify-center space-x-1.5 shadow-lg shadow-red-950/15 rounded-full transform hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Filing Reservation...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Secure Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
