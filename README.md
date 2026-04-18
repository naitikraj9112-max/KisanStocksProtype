# 🌾 Agri AI App

Intelligent crop yield prediction platform powered by real-time weather data and soil analysis.

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Supabase (Auth, Database, Storage)
- **Weather API**: AccuWeather
- **Language**: JavaScript

---

## Setup Instructions

### 1. Clone & Install

```bash
cd agri-ai-app/frontend
npm install
```

### 2. Configure Environment

Edit the `.env` file in the `agri-ai-app/` root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ACCUWEATHER_API_KEY=your_accuweather_key
```

### 3. Setup Supabase

#### Create `soil_reports` Table

Run this SQL in your Supabase SQL Editor (`https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`):

```sql
-- Create the soil_reports table
CREATE TABLE IF NOT EXISTS soil_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  nitrogen FLOAT NOT NULL,
  phosphorus FLOAT NOT NULL,
  potassium FLOAT NOT NULL,
  ph FLOAT NOT NULL,
  temperature FLOAT,
  humidity FLOAT,
  rainfall FLOAT,
  latitude FLOAT,
  longitude FLOAT,
  prediction FLOAT,
  file_url TEXT
);

-- Enable Row Level Security
ALTER TABLE soil_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own reports
CREATE POLICY "Allow authenticated inserts"
  ON soil_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all reports
CREATE POLICY "Allow authenticated reads"
  ON soil_reports
  FOR SELECT
  TO authenticated
  USING (true);
```

#### Create `soil-pdfs` Storage Bucket

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('soil-pdfs', 'soil-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'soil-pdfs');

-- Allow public access to read files
CREATE POLICY "Allow public reads"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'soil-pdfs');
```

### 4. Run the App

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Features

- 🔐 **Authentication** — Signup/Login via Supabase Auth
- 🧪 **Soil Analysis** — Input Nitrogen, Phosphorus, Potassium, pH
- 📍 **Auto Location** — Browser Geolocation API
- 🌦 **Live Weather** — AccuWeather API integration
- 📄 **PDF Upload** — Store soil health cards in Supabase Storage
- 🧠 **Yield Prediction** — Formula-based crop yield forecasting
- 📊 **Dashboard** — Premium split-layout with prediction cards

---

## Project Structure

```
agri-ai-app/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.js
│       │   ├── SoilForm.js
│       │   ├── PredictionCard.js
│       │   └── WeatherCard.js
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Signup.js
│       │   └── Dashboard.js
│       ├── services/
│       │   ├── supabaseClient.js
│       │   ├── weatherService.js
│       │   └── locationService.js
│       ├── utils/
│       │   └── prediction.js
│       ├── App.js
│       └── index.css
├── backend/
│   ├── model/
│   │   └── crop_model.py
│   └── api/
│       └── predict.py
├── .env
└── README.md
```
