import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  const { webhookId } = params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);
  
  console.log(`[API] Getting webhook stats for webhookId: ${webhookId}, days: ${days}`);
  
  // Generate daily stats for the specified days
  const dailyStats = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add randomized stats for each day
    const successCount = Math.floor(Math.random() * 15) + 5;
    const failedCount = Math.floor(Math.random() * 5);
    const pendingCount = Math.floor(Math.random() * 3);
    
    dailyStats.push({ date: dateStr, status: 'SUCCESS', count: successCount });
    if (failedCount > 0) {
      dailyStats.push({ date: dateStr, status: 'FAILED', count: failedCount });
    }
    if (pendingCount > 0) {
      dailyStats.push({ date: dateStr, status: 'PENDING', count: pendingCount });
    }
  }
  
  // Calculate overall stats
  const totalSuccess = dailyStats.filter(stat => stat.status === 'SUCCESS').reduce((sum, stat) => sum + stat.count, 0);
  const totalFailed = dailyStats.filter(stat => stat.status === 'FAILED').reduce((sum, stat) => sum + stat.count, 0);
  const totalPending = dailyStats.filter(stat => stat.status === 'PENDING').reduce((sum, stat) => sum + stat.count, 0);
  const totalDeliveries = totalSuccess + totalFailed + totalPending;
  
  return NextResponse.json({
    dailyStats,
    overallStats: [
      { status: 'SUCCESS', count: totalSuccess },
      { status: 'FAILED', count: totalFailed },
      { status: 'PENDING', count: totalPending }
    ],
    metrics: {
      totalDeliveries,
      successRate: totalDeliveries > 0 ? (totalSuccess / totalDeliveries) * 100 : 0,
      averageResponseMs: Math.floor(Math.random() * 300) + 100
    }
  });
} 