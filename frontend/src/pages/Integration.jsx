import React from "react";
import { Cog6ToothIcon, CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export default function Integration() {
  const integrationSteps = [
    {
      step: 1,
      title: "Python Script Configuration",
      description: "Ensure the Python script's BACKEND_URL points to http://localhost:3001/api/events",
      status: "pending",
    },
    {
      step: 2,
      title: "Backend Server",
      description: "Start the Node.js backend server on port 3001",
      status: "pending",
    },
    {
      step: 3,
      title: "Run Python Script",
      description: "Execute the Python script to start monitoring and posting events",
      status: "pending",
    },
    {
      step: 4,
      title: "Frontend Connection",
      description: "The frontend will automatically connect via Socket.IO for real-time updates",
      status: "pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration Settings</h1>
        <p className="text-gray-600">Configure your home security system integration</p>
      </div>

      {/* Integration Guide */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Setup Guide</h2>
        </div>

        <div className="space-y-4">
          {integrationSteps.map((step, index) => (
            <div
              key={step.step}
              className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step.step}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Configuration Files</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Python script: <code className="bg-blue-100 px-2 py-0.5 rounded">sasta project/main.py</code></li>
              <li>• Backend URL: <code className="bg-blue-100 px-2 py-0.5 rounded">http://localhost:3001/api/events</code></li>
              <li>• Integration helper: <code className="bg-blue-100 px-2 py-0.5 rounded">sasta project/backend_integration.py</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Backend API</span>
            <span className="text-sm font-medium text-gray-600">http://localhost:3001</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Socket.IO</span>
            <span className="text-sm font-medium text-gray-600">WebSocket Connection</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Python Integration</span>
            <span className="text-sm font-medium text-gray-600">Event Posting</span>
          </div>
        </div>
      </div>
    </div>
  );
}
