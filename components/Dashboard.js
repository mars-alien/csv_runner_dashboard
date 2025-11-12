'use client'

import React, { useState } from 'react';
import { Upload, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('overall');
  const [selectedPerson, setSelectedPerson] = useState('');

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have headers and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    if (!headers.includes('date') || !headers.includes('person') || !headers.includes('miles run')) {
      throw new Error('CSV must have columns: date, person, miles run');
    }

    const dateIdx = headers.indexOf('date');
    const personIdx = headers.indexOf('person');
    const milesIdx = headers.indexOf('miles run');

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1}: column count mismatch`);
      }

      const date = values[dateIdx];
      const person = values[personIdx];
      const miles = parseFloat(values[milesIdx]);

      if (!date || !person) {
        throw new Error(`Row ${i + 1}: date or person is empty`);
      }

      if (isNaN(miles) || miles < 0) {
        throw new Error(`Row ${i + 1}: invalid miles value "${values[milesIdx]}"`);
      }

      parsed.push({ date, person, miles });
    }

    return parsed;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCSV(event.target.result);
        setData(parsed);
        setError('');
        setView('overall');
      } catch (err) {
        setError(err.message);
        setData([]);
      }
    };
    reader.readAsText(file);
  };

  const calculateMetrics = (records) => {
    if (records.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
    
    const miles = records.map(r => r.miles);
    const total = miles.reduce((sum, m) => sum + m, 0);
    
    return {
      avg: total / miles.length,
      min: Math.min(...miles),
      max: Math.max(...miles),
      total
    };
  };

  const getPersonData = () => {
    const grouped = {};
    data.forEach(record => {
      if (!grouped[record.person]) {
        grouped[record.person] = [];
      }
      grouped[record.person].push(record);
    });
    return grouped;
  };

  const people = data.length > 0 ? Object.keys(getPersonData()) : [];
  const overallMetrics = calculateMetrics(data);
  const personData = getPersonData();

  const chartData = view === 'overall' 
    ? data.map(r => ({ date: r.date, miles: r.miles, person: r.person }))
    : selectedPerson && personData[selectedPerson]
      ? personData[selectedPerson].map(r => ({ date: r.date, miles: r.miles }))
      : [];

  const barChartData = view === 'overall'
    ? Object.entries(personData).map(([person, records]) => ({
        person,
        totalMiles: records.reduce((sum, r) => sum + r.miles, 0)
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Runner Dashboard</h1>
          <p className="text-gray-600">Upload a CSV file with columns: date, person, miles run</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <div className="flex flex-col items-center">
              <Upload className="w-10 h-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload CSV</span>
            </div>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}
        </div>

        {data.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setView('overall')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    view === 'overall'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Overall View
                </button>
                <button
                  onClick={() => setView('person')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    view === 'person'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Per-Person View
                </button>
              </div>

              {view === 'person' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Person
                  </label>
                  <select
                    value={selectedPerson}
                    onChange={(e) => setSelectedPerson(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a person...</option>
                    {people.map(person => (
                      <option key={person} value={person}>{person}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {view === 'overall' ? (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Total Runs</span>
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-900">Avg Miles</span>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">{overallMetrics.avg.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">Min Miles</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{overallMetrics.min.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-900">Max Miles</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">{overallMetrics.max.toFixed(2)}</p>
                    </div>
                  </>
                ) : selectedPerson && personData[selectedPerson] ? (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Total Runs</span>
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{personData[selectedPerson].length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-900">Avg Miles</span>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {calculateMetrics(personData[selectedPerson]).avg.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-900">Min Miles</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {calculateMetrics(personData[selectedPerson]).min.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-900">Max Miles</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900">
                        {calculateMetrics(personData[selectedPerson]).max.toFixed(2)}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {view === 'overall' && barChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Total Miles by Person</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="person" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalMiles" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {view === 'overall' ? 'Miles Run Over Time (All)' : `Miles Run Over Time - ${selectedPerson}`}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="miles" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
