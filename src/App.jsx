import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Car, CheckCircle, XCircle, ImageIcon, AlertCircle, RotateCcw } from 'lucide-react';
import { predictCarModel, predictCarModelFromUrl, checkBackendHealth, getModelInfo, getEligibleVehiclesList, searchEligibleVehicles, checkEligibilityClientSide } from './services/modelService';

// --- Firebase Configuration Placeholder ---
// TODO: Replace with actual Firebase config when backend is ready
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const App = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'url'
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [modelInfo, setModelInfo] = useState(null);
    const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'connected', 'error'
    
    // Fallback manual input state
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualMake, setManualMake] = useState('');
    const [manualModel, setManualModel] = useState('');
    const [eligibleVehicles] = useState(() => getEligibleVehiclesList());

    // Check backend connection on mount
    useEffect(() => {
        const initBackend = async () => {
            try {
                await checkBackendHealth();
                const info = await getModelInfo();
                setModelInfo(info);
                setBackendStatus('connected');
                
                // Warn if metadata files are missing
                if (!info.hasClassNames || !info.hasEligibilityMap) {
                    console.warn('⚠️ Metadata files missing. Please export from Colab.');
                }
            } catch (err) {
                console.error('Failed to connect to backend:', err);
                setBackendStatus('error');
                setError(err.message);
            }
        };
        initBackend();
    }, []);

    const handleFileUpload = useCallback((event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Validate file size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setImageUrl('');
            setResults(null);
            setError(null);
        } else {
            setFile(null);
            setPreviewUrl('');
        }
    }, []);

    const handleUrlChange = useCallback((event) => {
        const url = event.target.value;
        setImageUrl(url);
        setError(null);
        
        if (url) {
            setFile(null);
            setPreviewUrl(url);
            setResults(null);
        } else {
            setPreviewUrl('');
        }
    }, []);

    const handleUrlSubmit = useCallback(() => {
        if (!imageUrl) {
            setError('Please enter an image URL');
            return;
        }
        
        // Basic URL validation
        try {
            new URL(imageUrl);
            setPreviewUrl(imageUrl);
            setFile(null);
            setResults(null);
            setError(null);
        } catch (err) {
            setError('Please enter a valid URL');
        }
    }, [imageUrl]);

    // Manual eligibility check handler (for fallback mode)
    const handleManualEligibilityCheck = useCallback(() => {
        if (!manualMake || !manualModel) {
            setError('Please enter both make and model');
            return;
        }
        
        const eligibilityResult = checkEligibilityClientSide(manualMake, manualModel);
        
        setResults({
            name: `${manualMake} ${manualModel}`,
            confidence: eligibilityResult.confidence / 100,
            qualified: eligibilityResult.qualified,
            eligibility_reason: eligibilityResult.eligibility_reason,
            usingFallback: true,
            manualEntry: true
        });
        
        setShowManualInput(false);
        setManualMake('');
        setManualModel('');
    }, [manualMake, manualModel]);

    const startAnalysis = async () => {
        // Validate input (fallback will handle backend connection issues)
        if (inputMode === 'upload' && !file) {
            setError('Please upload a file first');
            return;
        }
        
        if (inputMode === 'url' && !imageUrl) {
            setError('Please enter an image URL first');
            return;
        }

        setIsAnalyzing(true);
        setResults(null);
        setError(null);
        
        try {
            let prediction;
            
            if (inputMode === 'upload') {
                // Use file upload endpoint
                prediction = await predictCarModel(file);
            } else {
                // Use URL endpoint (backend fetches the image)
                prediction = await predictCarModelFromUrl(imageUrl);
            }
            
            setResults(prediction);
            
            // If fallback requires manual input, show the form
            if (prediction.usingFallback && prediction.requiresManualInput) {
                setShowManualInput(true);
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze image. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = useCallback(() => {
        setFile(null);
        setPreviewUrl('');
        setImageUrl('');
        setResults(null);
        setError(null);
        setIsAnalyzing(false);
        setShowManualInput(false);
        setManualMake('');
        setManualModel('');
        // Clear file input
        const fileInput = document.getElementById('car-image-upload');
        if (fileInput) fileInput.value = '';
    }, []);

    // File Upload Area Component
    const FileUploadArea = () => (
        <div className="space-y-4">
            {/* Tab Selector */}
            <div className="flex gap-2 bg-beige-200 p-1 rounded-lg">
                <button
                    onClick={() => setInputMode('upload')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                        inputMode === 'upload'
                            ? 'bg-green-700 text-white shadow-md'
                            : 'text-green-700 hover:bg-beige-300'
                    }`}
                >
                    📁 Upload File
                </button>
                <button
                    onClick={() => setInputMode('url')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                        inputMode === 'url'
                            ? 'bg-green-700 text-white shadow-md'
                            : 'text-green-700 hover:bg-beige-300'
                    }`}
                >
                    🔗 Image URL
                </button>
            </div>

            {/* Upload Mode */}
            {inputMode === 'upload' && (
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
            )}

            {/* URL Mode */}
            {inputMode === 'url' && (
                <div className="border-4 border-dashed border-green-100 bg-beige-200/50 p-8 rounded-2xl">
                    <div className="text-green-700 mb-4 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-semibold text-green-700 text-center mb-4">
                        Enter Image URL
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={handleUrlChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                            placeholder="https://example.com/car-image.jpg"
                            className="flex-1 px-4 py-3 border-2 border-green-100 rounded-lg focus:outline-none focus:border-green-700 bg-white text-gray-800 placeholder-gray-400"
                        />
                        <button
                            onClick={handleUrlSubmit}
                            disabled={!imageUrl}
                            className="px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Load
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                        Paste a direct link to a car image
                    </p>
                </div>
            )}
        </div>
    );

    // Manual Input Component (for fallback mode when image recognition fails)
    const ManualInputPanel = () => {
        if (!showManualInput) return null;
        
        // Get unique makes from eligible vehicles
        const uniqueMakes = [...new Set(eligibleVehicles.map(v => v.make))].sort();
        
        return (
            <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                    <div>
                        <p className="text-amber-900 font-bold text-lg">Manual Input Required</p>
                        <p className="text-amber-700 text-sm mt-1">
                            We couldn't automatically identify the car from the image. Please enter the make and model manually to check eligibility.
                        </p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Make
                        </label>
                        <input
                            type="text"
                            value={manualMake}
                            onChange={(e) => setManualMake(e.target.value)}
                            placeholder="e.g., Tesla, Chevrolet, Nissan"
                            list="make-options"
                            className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-gray-800 placeholder-gray-400"
                        />
                        <datalist id="make-options">
                            {uniqueMakes.map(make => (
                                <option key={make} value={make} />
                            ))}
                        </datalist>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Model
                        </label>
                        <input
                            type="text"
                            value={manualModel}
                            onChange={(e) => setManualModel(e.target.value)}
                            placeholder="e.g., Model 3, Bolt EV, Leaf"
                            className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-gray-800 placeholder-gray-400"
                        />
                    </div>
                </div>
                
                <button
                    onClick={handleManualEligibilityCheck}
                    disabled={!manualMake || !manualModel}
                    className="mt-4 w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Check Eligibility
                </button>
                
                <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-amber-800 font-semibold hover:text-amber-900">
                        View all eligible vehicles ({eligibleVehicles.length})
                    </summary>
                    <div className="mt-3 max-h-60 overflow-y-auto bg-white rounded-lg p-4 border border-amber-200">
                        {uniqueMakes.map(make => {
                            const makeVehicles = eligibleVehicles.filter(v => v.make === make);
                            return (
                                <div key={make} className="mb-3">
                                    <p className="font-bold text-gray-800">{make}</p>
                                    <ul className="ml-4 text-sm text-gray-600">
                                        {makeVehicles.map((v, i) => (
                                            <li key={i}>
                                                {v.model} ({v.years}) - {v.type}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </details>
            </div>
        );
    };

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
                        <span className="ml-2 text-xs font-normal text-gray-400">v2.0 • URL + CSV</span>
                    </div>
                    <p className="text-lg text-gray-500 mt-1">California Tax Benefit Image Classifier</p>
                    
                    {/* Backend Status Indicator */}
                    {modelInfo && backendStatus === 'connected' && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-gray-600">
                                🤖 {modelInfo.modelType} • {modelInfo.numClasses} classes • {modelInfo.eligibleCount} eligible
                            </span>
                        </div>
                    )}
                    
                    {backendStatus === 'error' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>Backend not connected</span>
                        </div>
                    )}
                </header>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-800 whitespace-pre-line">{error}</p>
                        </div>
                    </div>
                )}

                {/* Fallback Mode Banner */}
                {results?.usingFallback && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-amber-800 font-semibold">⚠️ Using Offline Mode</p>
                            <p className="text-amber-700 text-sm mt-1">
                                Backend server is currently unavailable. Eligibility checking is based on our embedded database of eligible vehicles.
                                {results.backendError && ` (${results.backendError})`}
                            </p>
                        </div>
                    </div>
                )}

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
                        className="bg-green-700 text-white w-full mt-8 py-4 rounded-xl text-xl font-semibold flex items-center justify-center transition-all duration-300 disabled:opacity-50 hover:bg-green-800 disabled:cursor-not-allowed"
                        disabled={
                            (inputMode === 'upload' && !file) || 
                            (inputMode === 'url' && !imageUrl) || 
                            isAnalyzing
                        }
                        onClick={startAnalysis}
                    >
                        <div 
                            id="button-spinner" 
                            className={`${isAnalyzing ? '' : 'hidden'} w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3`}
                        ></div>
                        <span>
                            {isAnalyzing ? 'Analyzing...' : 
                             backendStatus !== 'connected' ? 'Analyze (Offline Mode)' : 
                             'Analyze Car for Eligibility'}
                        </span>
                    </button>
                </section>

                {/* Results Section */}
                <section id="results-section" className={`mt-12 ${results ? '' : 'hidden'}`}>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-3xl font-bold text-coffee-950">
                            Analysis Complete
                        </h2>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 bg-beige-200 text-coffee-500 rounded-lg font-medium hover:bg-beige-300 hover:text-coffee-700 transition-all duration-200 shadow-sm hover:shadow-md group"
                            title="Try another car"
                        >
                            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            <span>Try Again</span>
                        </button>
                    </div>

                    {/* Manual Input Panel (shown when fallback requires it) */}
                    <ManualInputPanel />

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Recognition Panel */}
                        <div className="bg-beige-200 p-6 rounded-2xl border border-beige-300 shadow-sm">
                            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-widest">
                                {results?.usingFallback ? '🔍 Pattern Match' : 'AI Car Recognition'}
                            </p>
                            <div className="flex items-center gap-4">
                                <Car className="w-8 h-8 text-coffee-500" />
                                <p className="text-2xl font-bold text-coffee-950">{results?.name || 'Unknown'}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                Confidence: {results?.confidence ? `${(results.confidence * 100).toFixed(1)}%` : 'N/A'}
                                {results?.isSimulated && ' (Simulated)'}
                                {results?.usingFallback && ' (Offline Mode)'}
                                {results?.manualEntry && ' (Manual Entry)'}
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
