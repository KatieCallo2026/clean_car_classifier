# CleanCar Qualify.AI 🚗⚡

A React web application that uses machine learning to classify car make/model from uploaded photos and determines eligibility for California's Clean Cars 4 All tax benefits.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎯 Project Overview

This project implements a **Type 1a Multiclass Image Classification** model that:
- Identifies a car's make and model from user-uploaded photos
- Cross-references predictions with California's Clean Cars 4 All program requirements
- Provides instant eligibility status for tax benefits

### Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom color palette
- **Icons**: Lucide React
- **ML Model**: CNN classifier (trained separately in Google Colab)
- **Backend**: Firebase (placeholder for future integration)

### Color Scheme

The application uses a clean, professional color palette:
- **Beige**: `#ede7d9` - Warm, neutral backgrounds
- **Deep Green**: `#084b3f` - Primary brand color
- **Coffee**: `#cb8966` - Accent and highlights
- **Light Green**: `#e5f3ef` - Success states
- **Dark Coffee**: `#41241a` - Text and emphasis

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A modern web browser

### Installation

1. **Clone or navigate to the project directory**:
```bash
cd CleanCars
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Open your browser**:
Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📁 Project Structure

```
CleanCars/
├── src/
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   ├── index.css            # Global styles with Tailwind
│   ├── services/
│   │   ├── api.js           # API communication utilities
│   │   └── modelService.js  # ML model integration service
│   └── models/
│       ├── README.md        # Model documentation
│       └── eligibility.md   # Clean Cars 4 All eligibility info
├── public/                  # Static assets
├── .github/
│   └── copilot-instructions.md
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🤖 Model Integration

### Current Status: Simulation Mode

The application currently runs in **simulation mode** while the CNN model is being trained in Google Colab. To integrate your trained model:

### Integration Steps

1. **Deploy Your Model**:
   - Deploy your trained CNN model to a cloud platform (AWS, GCP, Azure, Hugging Face)
   - Obtain the API endpoint URL

2. **Update Model Service** (`src/services/modelService.js`):
   ```javascript
   // Line 10-11: Update these constants
   const USE_SIMULATION = false;  // Disable simulation
   const MODEL_API_ENDPOINT = 'https://your-api.com/predict';
   ```

3. **Modify API Call** (if needed):
   ```javascript
   // Adjust the predictCarModel() function to match your API format
   // The function already handles FormData upload and JSON response
   ```

4. **Update Response Parsing**:
   ```javascript
   // Modify lines 48-54 to match your model's response format
   return {
       name: data.predicted_model,      // Adjust field names
       qualified: await checkQualification(data.predicted_model),
       confidence: data.confidence,
       raw: data
   };
   ```

### Model Requirements

Your trained model should accept:
- **Input**: Car image (JPG, PNG, HEIC, up to 5MB)
- **Output**: JSON with predicted make/model and confidence score

Example expected response:
```json
{
  "predicted_model": "Tesla Model 3 (BEV)",
  "confidence": 0.982,
  "make": "Tesla",
  "model": "Model 3",
  "year": 2023
}
```

## 🎨 Features

### Current Features

✅ **Image Upload**: Drag-and-drop or click to upload car photos  
✅ **Image Preview**: Instant preview of uploaded images  
✅ **Loading States**: Visual feedback during analysis  
✅ **Results Display**: Clean presentation of classification results  
✅ **Eligibility Check**: Cross-reference with Clean Cars 4 All criteria  
✅ **Responsive Design**: Works on desktop, tablet, and mobile  
✅ **Custom Styling**: Professional UI with Tailwind CSS  

### Planned Features

🔄 Real CNN model integration  
🔄 Firebase authentication  
🔄 Result history tracking  
🔄 PDF report generation  
🔄 Advanced eligibility details  
🔄 Multi-language support  

## 🔧 Configuration

### Tailwind Configuration

Custom colors are defined in `tailwind.config.js`:
```javascript
colors: {
  'beige-200': '#ede7d9',
  'green-700': '#084b3f',
  'coffee-500': '#cb8966',
  // ...more colors
}
```

### Vite Configuration

The project uses Vite for fast development and optimized builds. Configuration in `vite.config.js`.

## 📋 Clean Cars 4 All Program

### About the Program

The Clean Cars 4 All program provides financial incentives for lower-income California residents to:
- Retire older, high-polluting vehicles
- Replace them with cleaner alternatives (ZEV, PHEV, Hybrid)

### Eligibility Criteria

Vehicles typically qualify if they are:
- ✅ Battery Electric Vehicles (BEV)
- ✅ Plug-in Hybrid Electric Vehicles (PHEV)
- ✅ Fuel Cell Electric Vehicles (FCEV)
- ✅ Certain hybrid models
- ✅ Model year 2015 or newer (check current requirements)

### Resources

- [Official Program Website](https://ww2.arb.ca.gov/our-work/programs/clean-cars-4-all)
- Eligibility details in `src/models/eligibility.md`

## 🧪 Development

### Adding New Features

1. **Create a new branch**: `git checkout -b feature/your-feature`
2. **Make your changes**: Edit files in `src/`
3. **Test locally**: `npm run dev`
4. **Build**: `npm run build`
5. **Commit**: `git commit -m "Add your feature"`

### File Validation

Images are validated before upload:
- Maximum size: 5MB
- Allowed formats: JPG, PNG, HEIC, WebP
- Validation in `src/services/modelService.js`

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Failed to analyze car image"
- **Solution**: Check if simulation mode is enabled or if your API endpoint is accessible

**Issue**: Build fails with Tailwind errors
- **Solution**: CSS warnings about `@tailwind` directives are normal and won't affect the build

**Issue**: Icons not displaying
- **Solution**: Ensure `lucide-react` is installed: `npm install lucide-react`

## 📦 Deployment

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Model Training**: CNN classifier trained in Google Colab
- **Frontend Development**: React application with Tailwind CSS
- **Integration**: Model service architecture for seamless deployment

## 📞 Support

For questions or issues:
- Check `src/models/eligibility.md` for eligibility information
- Review `src/services/modelService.js` for integration details
- Open an issue on GitHub

## 🎉 Acknowledgments

- California Air Resources Board for the Clean Cars 4 All program
- Kaggle Car Detection Dataset
- Car Brand Classification dataset

---

**Note**: This application is currently in development. The model integration is in simulation mode. Replace with your trained CNN model when ready.
