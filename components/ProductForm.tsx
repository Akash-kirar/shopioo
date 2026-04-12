import React, { useState, useEffect } from 'react';
import { ProductData } from '../types';
import { Tag, IndianRupee, Layers, Type, Palette, Sparkles, Image as ImageIcon, Link as LinkIcon, ExternalLink, Plus, Loader2 } from 'lucide-react';

interface ProductFormProps {
  initialData: ProductData;
  imagePreview: string | null;
  enhancedImagePreview: string | null;
  generatedVariations?: string[];
  onSave: (data: ProductData) => void;
  onRetake: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
    initialData, 
    imagePreview, 
    enhancedImagePreview, 
    generatedVariations = [],
    onSave, 
    onRetake 
}) => {
  const [formData, setFormData] = React.useState<ProductData>(initialData);
  // Main display image state
  const [activeImage, setActiveImage] = useState<string | null>(enhancedImagePreview || imagePreview);

  // Auto-switch to enhanced image when it arrives, if the user is looking at the original
  useEffect(() => {
    if (enhancedImagePreview && activeImage === imagePreview) {
        setActiveImage(enhancedImagePreview);
    }
  }, [enhancedImagePreview, imagePreview, activeImage]);

  const handleChange = (field: keyof ProductData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = e.currentTarget.value.trim();
        if (val && !formData.tags.includes(val)) {
            setFormData(prev => ({...prev, tags: [...prev.tags, val]}));
            e.currentTarget.value = '';
        }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in duration-500">
        <div className="md:flex">
            {/* Image Section */}
            <div className="md:w-1/3 bg-gray-50 border-r border-gray-100 p-6 flex flex-col">
                <div className="aspect-square w-full rounded-xl overflow-hidden border border-gray-200 mb-4 bg-white shadow-sm relative group">
                    {activeImage ? (
                        <img src={activeImage} alt="Product" className="w-full h-full object-cover transition-all duration-300" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    
                    {/* Badge if it's the enhanced one */}
                    {activeImage === enhancedImagePreview && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1 animate-in zoom-in">
                            <Sparkles size={10} /> ENHANCED
                        </div>
                    )}
                </div>

                {/* Gallery / Variations */}
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider flex justify-between items-center">
                        <span>AI Assets</span>
                        {(!enhancedImagePreview || generatedVariations.length === 0) && (
                            <span className="text-[10px] flex items-center gap-1 text-indigo-500 animate-pulse">
                                <Loader2 size={10} className="animate-spin" /> Generating...
                            </span>
                        )}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                        {/* Original */}
                        {imagePreview && (
                             <button
                                type="button"
                                onClick={() => setActiveImage(imagePreview)}
                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === imagePreview ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
                             >
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Original" />
                             </button>
                        )}
                        {/* Enhanced */}
                        {enhancedImagePreview ? (
                             <button
                                type="button"
                                onClick={() => setActiveImage(enhancedImagePreview)}
                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${activeImage === enhancedImagePreview ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'} animate-in zoom-in duration-300`}
                             >
                                <img src={enhancedImagePreview} className="w-full h-full object-cover" alt="Enhanced" />
                                <div className="absolute inset-0 bg-indigo-900/10 pointer-events-none" />
                             </button>
                        ) : (
                             <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-100/50">
                                <Loader2 size={16} className="text-gray-300 animate-spin" />
                             </div>
                        )}
                        {/* Variations */}
                        {generatedVariations.map((src, idx) => (
                             <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveImage(src)}
                                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${activeImage === src ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'} animate-in zoom-in duration-300`}
                             >
                                <img src={src} className="w-full h-full object-cover" alt={`Variation ${idx}`} />
                             </button>
                        ))}
                        {/* Add Placeholder */}
                        <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer">
                            <Plus size={16} />
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                     <button 
                        type="button"
                        onClick={onRetake}
                        className="text-xs text-gray-500 hover:text-gray-900 underline decoration-gray-300 underline-offset-2"
                    >
                        Retake Photo
                    </button>
                </div>

                {formData.sources && formData.sources.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <LinkIcon size={12} /> Verified Sources
                        </h4>
                        <div className="space-y-2">
                            {formData.sources.slice(0, 3).map((source, idx) => (
                                <a 
                                    key={idx} 
                                    href={source} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 truncate hover:underline"
                                >
                                    <ExternalLink size={10} className="flex-shrink-0" />
                                    <span className="truncate">{new URL(source).hostname}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Form Section */}
            <div className="md:w-2/3 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Review Listing</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        Draft
                    </span>
                </div>

                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Type size={16} /> Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-gray-900"
                            placeholder="Product Title"
                        />
                    </div>

                    {/* Price & Category Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <IndianRupee size={16} /> Price (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Layers size={16} /> Category
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Condition & Color */}
                    <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Tag size={16} /> Condition
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) => handleChange('condition', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-gray-900"
                            >
                                <option>New</option>
                                <option>Like New</option>
                                <option>Used</option>
                                <option>Refurbished</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Palette size={16} /> Color
                            </label>
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => handleChange('color', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-white text-gray-900"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Press Enter to add)</label>
                        <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                            {formData.tags.map((tag) => (
                                <span key={tag} className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                    {tag}
                                    <button 
                                        type="button" 
                                        onClick={() => handleTagRemove(tag)}
                                        className="hover:text-indigo-950 ml-1 font-bold"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                className="bg-transparent outline-none flex-grow min-w-[100px] text-sm text-gray-900"
                                placeholder="Add a tag..."
                                onKeyDown={handleAddTag}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onRetake}
                        className="px-6 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                    >
                        Publish Listing
                    </button>
                </div>
            </div>
        </div>
    </form>
  );
};