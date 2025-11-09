import { useEffect, useMemo, useState } from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import { Slider } from '@heroui/react';
import { createOrder } from '../api/apiCalls';
import { useAuth } from '../context/AuthProvider';

interface PlaceOrderModalProps {
  onClose: () => void;
}

type SupplierType = 'manufacturer' | 'distributor' | 'service_provider';

interface OrderFormData {
  // Step 1 — Supplier Details
  supplierType: SupplierType;
  productName: string;
  productDescription: string;
  productSpecifications: string;
  productCertification: string;

  // Step 2 — Order Details
  quantity: string;
  unitOfMeasurement: string;
  unitPrice: string;
  lowerLimit: string;
  upperLimit: string;
  currency: string;
  totalPriceEstimate: string; // auto-calculated, stored as string for inputs

  // Step 3 — Delivery & Payment
  paymentTerms: string;
  preferredPaymentMethod: string;
  requiredDeliveryDate: string;
  location: string;
  shippingCost: 'included' | 'separate';
  packagingDetails: string;
  incoterms: string;
}

const PlaceOrderModal = ({ onClose }: PlaceOrderModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>({
    supplierType: 'manufacturer',
    productName: '',
    productDescription: '',
    productSpecifications: '',
    productCertification: '',

    quantity: '',
    unitOfMeasurement: '',
    unitPrice: '',
    lowerLimit: '',
    upperLimit: '',
    currency: 'USD',
    totalPriceEstimate: '',

    paymentTerms: 'Net 30',
    preferredPaymentMethod: 'Bank Transfer',
    requiredDeliveryDate: '',
    location: '',
    shippingCost: 'included',
    packagingDetails: '',
    incoterms: 'FOB',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
  }));
  };

  const canProceedStep1 = useMemo(() => {
    // If service provider, specs/incoterms can be skipped later
    return Boolean(
      formData.supplierType &&
      formData.productName.trim() &&
      formData.productDescription.trim() &&
      (formData.supplierType === 'service_provider' || formData.productSpecifications.trim() || true)
    );
  }, [formData]);

  const canProceedStep2 = useMemo(() => {
    return Boolean(
      formData.quantity !== '' &&
      formData.unitOfMeasurement.trim() &&
      formData.unitPrice !== '' &&
      formData.currency.trim() &&
      formData.lowerLimit.trim() &&
      formData.upperLimit.trim()
    );
  }, [formData]);

  const canProceedStep3 = useMemo(() => {
    return Boolean(
      formData.paymentTerms.trim() &&
      formData.preferredPaymentMethod.trim() &&
      formData.requiredDeliveryDate.trim() &&
      formData.location.trim() &&
      formData.shippingCost &&
      (formData.supplierType === 'service_provider' || formData.incoterms.trim() || true)
    );
  }, [formData]);

  useEffect(() => {
    const q = parseFloat(formData.quantity || '');
    const p = parseFloat(formData.unitPrice || '');
    if (!isNaN(q) && !isNaN(p)) {
      setFormData(prev => ({ ...prev, totalPriceEstimate: String(q * p) }));
    } else {
      setFormData(prev => ({ ...prev, totalPriceEstimate: '' }));
    }
  }, [formData.quantity, formData.unitPrice]);

  const numericUnitPrice = parseFloat(formData.unitPrice || '');
  const hasUnitPrice = !isNaN(numericUnitPrice) && numericUnitPrice > 0;
  const sliderMin = hasUnitPrice ? parseFloat((numericUnitPrice * 0.5).toFixed(2)) : 0;
  const sliderMax = hasUnitPrice ? parseFloat((numericUnitPrice * 1.5).toFixed(2)) : 0;

  // Get current slider values from formData or calculate defaults
  const currentLower = hasUnitPrice
    ? (formData.lowerLimit ? Math.max(sliderMin, Math.min(parseFloat(formData.lowerLimit), sliderMax)) : sliderMin)
    : 0;
  const currentUpper = hasUnitPrice
    ? (formData.upperLimit ? Math.max(currentLower, Math.min(parseFloat(formData.upperLimit), sliderMax)) : sliderMax)
    : 0;
  
  // Display values - use formData if available, otherwise show calculated values
  const displayLower = formData.lowerLimit || (hasUnitPrice ? currentLower.toFixed(2) : '--');
  const displayUpper = formData.upperLimit || (hasUnitPrice ? currentUpper.toFixed(2) : '--');

  // Initialize negotiation range when unit price is entered
  useEffect(() => {
    if (!hasUnitPrice) {
      // Clear limits when unit price is removed
      setFormData(prev => {
        if (prev.lowerLimit === '' && prev.upperLimit === '') return prev;
        return { ...prev, lowerLimit: '', upperLimit: '' };
      });
      return;
    }

    // Only initialize if limits are empty or invalid
    setFormData(prev => {
      const currentLowerNum = prev.lowerLimit ? parseFloat(prev.lowerLimit) : NaN;
      const currentUpperNum = prev.upperLimit ? parseFloat(prev.upperLimit) : NaN;
      
      // If limits are empty or out of range, initialize them
      if (isNaN(currentLowerNum) || currentLowerNum < sliderMin || currentLowerNum > sliderMax ||
          isNaN(currentUpperNum) || currentUpperNum < sliderMin || currentUpperNum > sliderMax) {
        return {
          ...prev,
          lowerLimit: sliderMin.toFixed(2),
          upperLimit: sliderMax.toFixed(2),
        };
      }
      
      // Otherwise, just normalize existing values
      const normalizedLower = Math.max(sliderMin, Math.min(currentLowerNum, sliderMax));
      const normalizedUpper = Math.max(normalizedLower, Math.min(currentUpperNum, sliderMax));
      const lowerStr = normalizedLower.toFixed(2);
      const upperStr = normalizedUpper.toFixed(2);

      if (prev.lowerLimit === lowerStr && prev.upperLimit === upperStr) {
        return prev;
      }

      return {
        ...prev,
        lowerLimit: lowerStr,
        upperLimit: upperStr,
      };
    });
  }, [hasUnitPrice, sliderMin, sliderMax]);

  const handleSliderChange = (value: number | number[]) => {
    if (!hasUnitPrice || !Array.isArray(value)) return;
    const [lower, upper] = value;
    const clampedLower = Math.max(sliderMin, Math.min(lower, sliderMax));
    const clampedUpper = Math.max(clampedLower, Math.min(upper, sliderMax));
    setFormData(prev => ({
      ...prev,
      lowerLimit: clampedLower.toFixed(2),
      upperLimit: clampedUpper.toFixed(2),
    }));
  };

  // Helper to check if a step is completed
  const isStepCompleted = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return Boolean(canProceedStep1);
      case 2:
        return Boolean(canProceedStep2);
      case 3:
        return Boolean(canProceedStep3);
      case 4:
        return step === 4;
      default:
        return false;
    }
  };

  // Handle step navigation - only allow going to completed steps or next step
  const handleStepClick = (targetStep: number) => {
    // Allow going to any step that's been completed or is the current step
    if (targetStep <= step || isStepCompleted(targetStep - 1)) {
      setStep(targetStep);
    }
  };

  // Helper component for required field label
  const RequiredLabel = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => {
    const isRequired = Boolean(required);
    return (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {children}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      console.error('Cannot place order: no authenticated user');
      setSubmitError('You must be logged in to place an order');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createOrder(formData);
      
      if (result.success) {
        // Order created successfully
        console.log('Order created successfully:', result.order);
        onClose();
        // Optionally show a success message or redirect
      } else {
        setSubmitError(result.error || 'Failed to create order');
      }
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      setSubmitError(err.response?.data?.error || err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    // Minimal draft behavior: log and close (or store locally)
    console.log('Draft saved:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Place New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Multi-step progress */}
          <div className="flex items-center mb-6">
            {[1, 2, 3, 4].map((s, idx) => {
              const isCompleted = step > s;
              const isCurrent = step === s;
              const canNavigate = isCompleted || isCurrent || isStepCompleted(s - 1);
              
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => canNavigate && handleStepClick(s)}
                      disabled={!canNavigate}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCurrent 
                          ? 'bg-primary-600 text-white ring-2 ring-primary-300' 
                          : isCompleted
                          ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                          : canNavigate
                          ? 'bg-gray-300 text-gray-700 hover:bg-gray-400 cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : String(s)}
                    </button>
                    <span className="mt-1 text-xs font-medium text-gray-600">
                      {s === 1 ? 'Supplier' : s === 2 ? 'Order' : s === 3 ? 'Delivery' : 'Review'}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1 — Supplier Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RequiredLabel required>Supplier Type</RequiredLabel>
                  <select name="supplierType" value={formData.supplierType} onChange={handleInputChange} className="input-field" required>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="distributor">Distributor</option>
                    <option value="service_provider">Service Provider</option>
                  </select>
                </div>
                <div>
                  <RequiredLabel required>Product / Item Name</RequiredLabel>
                  <input name="productName" value={formData.productName} onChange={handleInputChange} className="input-field" required />
                </div>
              </div>

              <div>
                <RequiredLabel required>Product Description</RequiredLabel>
                <textarea name="productDescription" value={formData.productDescription} onChange={handleInputChange} className="input-field h-20 resize-none" placeholder="overall description, context of use, etc." required />
              </div>

              {formData.supplierType !== 'service_provider' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Specifications</label>
                    <textarea name="productSpecifications" value={formData.productSpecifications} onChange={handleInputChange} className="input-field h-20 resize-none" placeholder="grade, size, material, etc." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Certification / Quality Standards</label>
                    <input name="productCertification" value={formData.productCertification} onChange={handleInputChange} className="input-field" placeholder="ISO, ASTM, FDA, etc." />
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={handleSaveDraft}>Save as Draft</button>
                <button type="button" onClick={() => setStep(2)} disabled={!canProceedStep1} className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Order Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RequiredLabel required>Quantity</RequiredLabel>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="input-field" required />
                </div>
                <div>
                  <RequiredLabel required>Unit of Measurement</RequiredLabel>
                  <select name="unitOfMeasurement" value={formData.unitOfMeasurement} onChange={handleInputChange} className="input-field" required>
                    <option value="">Select unit</option>
                    <option value="kg">kg</option>
                    <option value="pieces">pieces</option>
                    <option value="boxes">boxes</option>
                    <option value="meters">meters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RequiredLabel required>Unit Price</RequiredLabel>
                  <input 
                    type="number" 
                    step="0.01"
                    name="unitPrice" 
                    value={formData.unitPrice} 
                    onChange={handleInputChange} 
                    className="input-field" 
                    required 
                  />
                </div>
                <div>
                  <RequiredLabel required>Currency</RequiredLabel>
                  <select name="currency" value={formData.currency} onChange={handleInputChange} className="input-field" required>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <div className="mb-4">
                  <RequiredLabel required>Negotiation Range</RequiredLabel>
                  <p className="text-xs text-gray-500 mt-1">Set your acceptable price range (50% - 150% of unit price)</p>
                </div>
                {hasUnitPrice ? (
                  <div className="space-y-3">
                    <div className="relative px-2 py-8">
                      {/* Dollar amounts above slider thumbs */}
                      <div className="absolute top-0 left-0 right-0 flex justify-between px-2">
                        <div className="text-sm font-semibold text-gray-900 bg-white px-2.5 py-1.5 rounded shadow-md border border-gray-300 whitespace-nowrap">
                          {formData.currency} {displayLower}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 bg-white px-2.5 py-1.5 rounded shadow-md border border-gray-300 whitespace-nowrap">
                          {formData.currency} {displayUpper}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Slider
                          step={0.01}
                          minValue={sliderMin}
                          maxValue={sliderMax}
                          value={[currentLower, currentUpper]}
                          onChange={handleSliderChange}
                          showTooltip={false}
                          aria-label="Negotiation range"
                          className="w-full"
                          classNames={{
                            base: "w-full max-w-full",
                            track: "h-3 bg-gray-200",
                            filler: "bg-primary-600",
                            thumb: "w-6 h-6 bg-primary-600 border-2 border-white shadow-lg",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded border border-gray-200">
                    <p className="text-sm text-gray-600">Enter a unit price above to configure the negotiation range.</p>
                  </div>
                )}
              </div>

              <div>
                <RequiredLabel>Total Price Estimate:</RequiredLabel>
                <input readOnly value={formData.totalPriceEstimate ? `${formData.currency} ${formData.totalPriceEstimate}` : ''} className="input-field bg-gray-50" />
              </div>

              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!canProceedStep2} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3 — Delivery & Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RequiredLabel required>Payment Terms</RequiredLabel>
                  <select name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="input-field" required>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div>
                  <RequiredLabel required>Preferred Payment Method</RequiredLabel>
                  <select name="preferredPaymentMethod" value={formData.preferredPaymentMethod} onChange={handleInputChange} className="input-field" required>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RequiredLabel required>Required Delivery Date</RequiredLabel>
                  <input type="date" name="requiredDeliveryDate" value={formData.requiredDeliveryDate} onChange={handleInputChange} className="input-field" required />
                </div>
                <div>
                  <RequiredLabel required>Delivery Location</RequiredLabel>
                  <input name="location" value={formData.location} onChange={handleInputChange} className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <RequiredLabel required>Shipping Cost</RequiredLabel>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="shippingCost" value="included" checked={formData.shippingCost === 'included'} onChange={handleInputChange} className="mr-2" />
                      Included
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="shippingCost" value="separate" checked={formData.shippingCost === 'separate'} onChange={handleInputChange} className="mr-2" />
                      Separate
                    </label>
                  </div>
                </div>
                <div>
                  <RequiredLabel>Packaging Details</RequiredLabel>
                  <textarea name="packagingDetails" value={formData.packagingDetails} onChange={handleInputChange} className="input-field h-20 resize-none" placeholder="special handling, etc." />
                </div>
              </div>

              {formData.supplierType !== 'service_provider' && (
                <div>
                  <RequiredLabel required>Incoterms</RequiredLabel>
                  <select name="incoterms" value={formData.incoterms} onChange={handleInputChange} className="input-field" required>
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="button" onClick={() => setStep(4)} disabled={!canProceedStep3} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
              </div>
            </div>
          )}

          {/* Step 4 — Review & Confirm */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Supplier Details</h3>
                  <button type="button" className="text-primary-600 text-sm" onClick={() => setStep(1)}>Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div><span className="font-medium">Supplier Type:</span> {formData.supplierType}</div>
                  <div><span className="font-medium">Product Name:</span> {formData.productName}</div>
                  <div className="col-span-2"><span className="font-medium">Product Description:</span> {formData.productDescription}</div>
                  {formData.supplierType !== 'service_provider' && (
                    <>
                      <div className="col-span-2"><span className="font-medium">Product Specifications:</span> {formData.productSpecifications || '-'}</div>
                      <div className="col-span-2"><span className="font-medium">Certifications:</span> {formData.productCertification || '-'}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Order Details</h3>
                  <button type="button" className="text-primary-600 text-sm" onClick={() => setStep(2)}>Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div><span className="font-medium">Quantity:</span> {formData.quantity} {formData.unitOfMeasurement}</div>
                  <div><span className="font-medium">Unit Price:</span> {formData.unitPrice} {formData.currency}</div>
                  <div><span className="font-medium">Total Estimate:</span> {formData.totalPriceEstimate} {formData.currency}</div>
                  <div><span className="font-medium">Lower Limit:</span> {formData.lowerLimit}</div>
                  <div><span className="font-medium">Upper Limit:</span> {formData.upperLimit}</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Delivery & Payment</h3>
                  <button type="button" className="text-primary-600 text-sm" onClick={() => setStep(3)}>Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div><span className="font-medium">Payment Terms:</span> {formData.paymentTerms}</div>
                  <div><span className="font-medium">Payment Method:</span> {formData.preferredPaymentMethod}</div>
                  <div><span className="font-medium">Required Delivery Date:</span> {formData.requiredDeliveryDate}</div>
                  <div><span className="font-medium">Location:</span> {formData.location}</div>
                  <div><span className="font-medium">Shipping Cost:</span> {formData.shippingCost}</div>
                  {formData.supplierType !== 'service_provider' && (
                    <div><span className="font-medium">Incoterms:</span> {formData.incoterms}</div>
                  )}
                  <div className="col-span-2"><span className="font-medium">Packaging Details:</span> {formData.packagingDetails || '-'}</div>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between">
                <button type="button" className="btn-secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
                  Save as Draft
                </button>
                <button 
                  type="submit" 
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Place Order'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderModal;
