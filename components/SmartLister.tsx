import React, { useState } from 'react';
import { CameraView } from './CameraView';
import { AnalyzingLoader } from './AnalyzingLoader';
import { ProductForm } from './ProductForm';
import { ProductData, ListingStep } from '../types';
import { analyzeProductImage, enhanceProductImage, fileToGenerativePart, generateProductVariations } from '../services/geminiService';
import { CheckCircle, ArrowRight, X, ArrowLeft, Sparkles } from 'lucide-react';
import { saveItem } from '../utils';

interface SmartListerProps {
  shopId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const SmartLister: React.FC<SmartListerProps> = ({ shopId, onClose, onSuccess }) => {
  const [step, setStep] = useState<ListingStep['current']>('capture');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleCapture = async (file: File) => {
    // 1. Show preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setStep('analyzing');
    setIsEnhancing(true);

    try {
      // 2. Convert to Base64 for Gemini
      const base64Data = await fileToGenerativePart(file);
      
      // 3. Start AI Services
      // Prioritize text analysis to unblock the user UI quickly ("fast and under 10s")
      const analysisPromise = analyzeProductImage(base64Data, file.type);
      
      // Wait ONLY for analysis to show the form
      const data = await analysisPromise;
      
      setProductData(data);
      setStep('review');

      // 4. Start Background Image Tasks (Staggered)
      // We start these ONLY after analysis is done to prevent "rate limit" spikes
      // caused by firing 3 high-compute requests simultaneously.
      
      (async () => {
        try {
          const enhancedImgBase64 = await enhanceProductImage(base64Data, file.type);
          if (enhancedImgBase64) {
            setEnhancedImage(`data:image/png;base64,${enhancedImgBase64}`);
          }
        } catch (err) {
          console.error("Background enhancement failed", err);
        }

        // Add a small delay between enhancement and variations
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
          const variations = await generateProductVariations(base64Data, file.type);
          if (variations.length > 0) {
            setGeneratedVariations(variations.map(v => `data:image/png;base64,${v}`));
          }
        } catch (err) {
          console.error("Background variations failed", err);
        } finally {
          setIsEnhancing(false);
        }
      })();

    } catch (error) {
      console.error("Failed to analyze", error);
      alert("Something went wrong with the AI analysis. Please try again.");
      setStep('capture');
      setIsEnhancing(false);
    }
  };

  const handleSave = async (finalData: ProductData) => {
    const itemToSave = {
        id: Date.now().toString(),
        shopId: shopId || 'smart_listing',
        name: finalData.title,
        price: `₹${finalData.price}`,
        image: enhancedImage || imagePreview || '', // Prefer enhanced image
        category: finalData.category,
        description: finalData.description,
        tag: finalData.tags[0],
        originalPrice: finalData.condition === 'New' ? undefined : `₹${Math.round(finalData.price * 1.2)}` // Mock original price for deals
    };
    await saveItem(itemToSave);

    setStep('success');
  };

  const handleRetake = () => {
    setProductData(null);
    setImagePreview(null);
    setEnhancedImage(null);
    setGeneratedVariations([]);
    setStep('capture');
    setIsEnhancing(false);
  };

  const handleReset = () => {
      setStep('capture');
      setProductData(null);
      setImagePreview(null);
      setEnhancedImage(null);
      setGeneratedVariations([]);
      setIsEnhancing(false);
  }

  return (
    <div className="bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 min-h-screen fixed inset-0 z-[100] overflow-y-auto">
      {/* Sub-Header for Smart Listing Steps */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                )}
                <h1 className="font-black text-xl text-[#a82283] flex items-center gap-2">
                   <Sparkles className="w-6 h-6" /> AI Listing
                </h1>
            </div>
            
            {step !== 'success' && (
                <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm font-medium text-gray-500">
                    <span className={`transition-colors ${step === 'capture' ? 'text-[#a82283] font-bold' : ''}`}>1. Upload</span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span className={`transition-colors ${step === 'analyzing' ? 'text-[#a82283] font-bold' : ''}`}>2. AI Analysis</span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span className={`transition-colors ${step === 'review' ? 'text-[#a82283] font-bold' : ''}`}>3. Review</span>
                </div>
            )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-24">
        
        {step === 'capture' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-4 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">List it in seconds.</h2>
                    <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
                        Upload a photo of the item. Our AI will identify it, enhance the photo, and write the listing for you.
                    </p>
                </div>
                <div className="h-[500px] md:h-[600px] w-full shadow-xl rounded-2xl overflow-hidden ring-4 ring-white">
                    <CameraView onCapture={handleCapture} />
                </div>
            </div>
        )}

        {step === 'analyzing' && (
            <div className="max-w-2xl mx-auto pt-10">
                <AnalyzingLoader />
            </div>
        )}

        {step === 'review' && productData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Review Listing</h2>
                    <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                        AI has drafted your listing. 
                        {isEnhancing && <span className="text-indigo-600 font-bold flex items-center gap-1 animate-pulse"><Sparkles size={12}/> Enhancing images...</span>}
                    </p>
                </div>
                <ProductForm 
                    initialData={productData} 
                    imagePreview={imagePreview}
                    enhancedImagePreview={enhancedImage}
                    generatedVariations={generatedVariations}
                    onSave={handleSave}
                    onRetake={handleRetake}
                />
            </div>
        )}

        {step === 'success' && (
            <div className="max-w-md mx-auto text-center pt-16 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Listing Published!</h2>
                <p className="text-gray-600 mb-8 font-medium">
                    Your product is now live. The AI optimization will help it reach the right customers.
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={handleReset}
                        className="w-full py-4 px-4 bg-[#a82283] hover:bg-[#8a1c6b] text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
                    >
                        List Another Item
                    </button>
                    {onSuccess && (
                        <button 
                            onClick={onSuccess}
                            className="w-full py-4 px-4 bg-white border border-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]"
                        >
                            Return to Shop
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};