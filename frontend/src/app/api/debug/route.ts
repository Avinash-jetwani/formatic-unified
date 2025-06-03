import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

export async function GET(request: NextRequest) {
  try {
    // Check if the backend API is accessible
    const apiStatus = await axios.get(`${API_URL}/api-status`, { timeout: 5000 })
      .then(res => ({ status: 'success', data: res.data }))
      .catch(err => ({ 
        status: 'error', 
        message: err.message,
        code: err.code,
        response: err.response?.data
      }));
    
    return NextResponse.json({
      api_url: API_URL,
      api_status: apiStatus,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      api_url: API_URL
    }, { status: 500 });
  }
} 