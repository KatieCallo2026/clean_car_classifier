import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Car, CheckCircle, XCircle, ImageIcon } from 'lucide-react';
import { predictCarModel, validateImageFile } from './services/modelService';

// --- Firebase Configuration Placeholder ---
// TODO: Replace with actual Firebase config when backend is ready
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const App = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    // Firebase initialization check
    useEffect(() => {
        if (firebaseConfig) {
            console.log("Firebase config loaded. Ready for real backend connection.");
        } else {
            console.warn("Firebase config not available. Running simulation mode.");
        }
    }, []);

    const handleFileUpload = useCallback((event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Validate file size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResults(null); // Reset results on new upload
        } else {
            setFile(null);
            setPreviewUrl('');
        }
    }, []);

    const startAnalysis = async () => {
        if (!file) return;

        // Validate file before processing
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            alert(validation.error);
            return;
        }

        setIsAnalyzing(true);
        setResults(null);
        
        try {
            // Call the model service to predict car model
            const prediction = await predictCarModel(file);
            setResults(prediction);
        } catch (error) {
            console.error('Analysis error:', error);
            alert(error.message || 'Failed to analyze car image. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // File Upload Area Component
    const FileUploadArea = () => (
        <div 
            className="border-4 border-dashed border-green-100 bg-beige-200/50 p-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-700 transition duration-300"
            onClick={() => document.getElementById('car-image-upload').click()}
        >
            <div className="text-green-700 mb-3">
                {file ? <ImageIcon className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
            </div>
            <p className="text-lg font-semibold text-green-700">
                {file ? `File selected: ${file.name}` : 'Click to upload your car photo'}
            </p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, or HEIC (Max 5MB)</p>
            <input 
                type="file" 
                id="car-image-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
            />
        </div>
    );

    // Eligibility Panel Component
    const EligibilityPanel = () => {
        if (!results) return null;

        const isQualified = results.qualified;
        const panelClasses = isQualified
            ? 'bg-green-50 border-green-700'
            : 'bg-coffee-500/30 border-coffee-500';
        
        const icon = isQualified ? (
            <CheckCircle className="w-10 h-10 text-green-700" />
        ) : (
            <XCircle className="w-10 h-10 text-coffee-500" />
        );

        const statusText = isQualified ? "QUALIFIED" : "NOT QUALIFIED";
        const statusColor = isQualified ? 'text-green-700' : 'text-coffee-500';
        
        const message = isQualified 
            ? `Great news! The identified vehicle, a ${results.name}, meets the criteria for California's Clean Car tax benefits. Proceed with your application!`
            : `The identified vehicle, a ${results.name}, does not appear to qualify under current guidelines. It may not meet the minimum emissions standard.`;

        return (
            <div id="eligibility-panel" className={`p-6 rounded-2xl border transition-all duration-500 ${panelClasses}`}>
                <p className={`text-sm font-semibold mb-2 uppercase tracking-widest ${isQualified ? 'text-green-700' : 'text-coffee-950'}`}>
                    Clean Car Eligibility Status
                </p>
                <div className="flex items-center gap-4">
                    {icon}
                    <p className={`text-3xl font-bold ${statusColor}`}>{statusText}</p>
                </div>
                <p className="text-base mt-3">{message}</p>
            </div>
        );
    };

    // Qualified Car SVG Diagram Component
    const QualifiedCarDiagram = () => (
        <div id="diagram-hint" className="mt-8 p-6 border-4 border-dashed border-green-700 bg-green-50 rounded-2xl">
            <p className="text-lg font-semibold text-green-700 mb-2">Example of a Qualified Zero-Emission Vehicle</p>
            <div className="flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 150" fill="none" className="w-full max-w-sm" aria-hidden="true">
                    {/* Ground */}
                    <rect x="0" y="120" width="400" height="30" fill="#EAEAEA"/>
                    {/* Body (Deep Green) */}
                    <rect x="50" y="50" width="300" height="70" rx="10" fill="#084b3f"/>
                    {/* Cabin (Darker Green) */}
                    <rect x="150" y="20" width="100" height="40" rx="5" fill="#06372e"/>
                    {/* Wheels (Coffee Dark) */}
                    <circle cx="100" cy="120" r="20" fill="#41241a"/>
                    <circle cx="300" cy="120" r="20" fill="#41241a"/>
                    {/* Headlights/Accents (Warm Accent) */}
                    <rect x="330" y="70" width="10" height="10" rx="2" fill="#cb8966"/>
                    <rect x="60" y="70" width="10" height="10" rx="2" fill="#cb8966"/>
                    {/* Electric Plug Icon (Beige Accent) */}
                    <path d="M200 60 L200 10 L220 10 L220 60 Z" fill="#ede7d9"/>
                    <path d="M220 10 L230 20 L220 30" stroke="#ede7d9" strokeWidth="3" fill="none"/>
                </svg>
            </div>
            <p className="text-sm text-gray-600 mt-2">This illustrates the type of modern, zero-emission vehicle (BEV or PHEV) that typically qualifies.</p>
        </div>
    );

    return (
        <div 
            className="flex flex-col items-center pt-16 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen w-full bg-gradient-to-br from-beige-200 to-gray-50"
        >
            {/* Main Container Card */}
            <div className="w-full max-w-4xl bg-white rounded-[32px] p-6 sm:p-12 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),_0_4px_6px_-2px_rgba(0,0,0,0.05)]">
                
                {/* Header / Logo */}
                <header className="flex flex-col items-start pb-8 border-b border-gray-100 mb-8">
                    <div className="text-3xl font-extrabold tracking-tighter text-green-700">
                        CleanCar Qualify<span className="text-coffee-500">.AI</span>
                    </div>
                    <p className="text-lg text-gray-500 mt-1">California Tax Benefit Image Classifier</p>
                </header>

                {/* Main Input Section */}
                <section id="input-section">
                    <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-coffee-950">
                        Check Your Car's Eligibility Instantly.
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Upload a photo of your vehicle to classify its make and model and cross-reference it with the Clean Cars 4 All tax benefit criteria.
                    </p>

                    {/* File Upload Area */}
                    <FileUploadArea />
                    
                    {/* Image Preview */}
                    <div className={`mt-6 ${previewUrl ? '' : 'hidden'}`}>
                        <img 
                            id="image-preview" 
                            src={previewUrl} 
                            alt="Car Preview"
                            className="w-full h-80 object-contain rounded-xl border border-gray-200 bg-gray-50"
                        />
                    </div>

                    {/* Action Button */}
                    <button 
                        id="analyze-button" 
                        className="bg-green-700 text-white w-full mt-8 py-4 rounded-xl text-xl font-semibold flex items-center justify-center transition-all duration-300 disabled:opacity-50 hover:bg-green-800"
                        disabled={!file || isAnalyzing}
                        onClick={startAnalysis}
                    >
                        <div 
                            id="button-spinner" 
                            className={`${isAnalyzing ? '' : 'hidden'} w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3`}
                        ></div>
                        <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Car for Eligibility'}</span>
                    </button>
                </section>

                {/* Results Section */}
                <section id="results-section" className={`mt-12 ${results ? '' : 'hidden'}`}>
                    <h2 className="text-3xl font-bold border-b border-gray-100 pb-4 mb-6 text-coffee-950">
                        Analysis Complete
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Recognition Panel */}
                        <div className="bg-beige-200 p-6 rounded-2xl border border-beige-300 shadow-sm">
                            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-widest">AI Car Recognition</p>
                            <div className="flex items-center gap-4">
                                <Car className="w-8 h-8 text-coffee-500" />
                                <p className="text-2xl font-bold text-coffee-950">{results?.name || 'Unknown'}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                Confidence: {results?.confidence ? `${(results.confidence * 100).toFixed(1)}%` : 'N/A'}
                                {results?.isSimulated && ' (Simulated)'}
                            </p>
                        </div>

                        {/* Eligibility Panel */}
                        <EligibilityPanel />
                    </div>

                    {/* Program Details */}
                    <div className="mt-10 pt-6 border-t border-gray-100">
                        <h3 className="text-xl font-semibold mb-3 text-green-700">About the Clean Cars 4 All Program</h3>
                        <p className="text-base text-gray-700">
                            The Clean Cars 4 All program provides incentives for lower-income consumers to retire their older, high-polluting vehicles and replace them with newer, cleaner options (zero-emission or hybrid). Your eligibility is determined by your car's model and its emission status. <a href="https://ww2.arb.ca.gov/our-work/programs/clean-cars-4-all" target="_blank" rel="noopener noreferrer" className="text-coffee-500 underline font-medium">Learn more about the program requirements.</a>
                        </p>
                    </div>
                    
                    {/* Diagram Hint (Visible only if qualified) */}
                    {results?.qualified && <QualifiedCarDiagram />}

                </section>

            </div>
        </div>
    );
}

export default App;
