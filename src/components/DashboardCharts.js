import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardCharts = ({ transactions }) => {
  // Group and process data for charts
  const processChartData = () => {
    // Skip if no transactions
    if (!transactions || transactions.length === 0) {
      return {
        dates: [],
        incomeByDate: [],
        expenseByDate: [],
        incomeByCategoryLabels: [],
        incomeByCategoryData: [],
        expenseByCategoryLabels: [],
        expenseByCategoryData: [],
        cumulativeDates: [],
        cumulativeData: []
      };
    }

    // Format date strings for display
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    // Group by date
    const dateGroups = {};
    transactions.forEach(t => {
      if (!dateGroups[t.date]) {
        dateGroups[t.date] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dateGroups[t.date].income += t.amount;
      } else {
        dateGroups[t.date].expense += t.amount;
      }
    });

    // Sort dates
    const dates = Object.keys(dateGroups).sort();
    const incomeByDate = dates.map(d => dateGroups[d].income);
    const expenseByDate = dates.map(d => dateGroups[d].expense);
    const displayDates = dates.map(formatDate);

    // Group by category
    const incomeByCategory = {};
    const expenseByCategory = {};
    
    transactions.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    });

    const incomeByCategoryLabels = Object.keys(incomeByCategory);
    const incomeByCategoryData = incomeByCategoryLabels.map(c => incomeByCategory[c]);
    
    const expenseByCategoryLabels = Object.keys(expenseByCategory);
    const expenseByCategoryData = expenseByCategoryLabels.map(c => expenseByCategory[c]);

    // Calculate cumulative earnings
    let cumulative = 0;
    const cumulativeData = [];
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Group by date for cumulative chart
    const cumulativeDateGroups = {};
    sortedTransactions.forEach(t => {
      if (!cumulativeDateGroups[t.date]) {
        cumulativeDateGroups[t.date] = 0;
      }
      cumulativeDateGroups[t.date] += t.type === 'income' ? t.amount : -t.amount;
    });
    
    const cumulativeDates = Object.keys(cumulativeDateGroups).sort();
    cumulativeDates.forEach(date => {
      cumulative += cumulativeDateGroups[date];
      cumulativeData.push(cumulative);
    });
    
    const cumulativeDisplayDates = cumulativeDates.map(formatDate);

    return {
      dates: displayDates,
      incomeByDate,
      expenseByDate,
      incomeByCategoryLabels,
      incomeByCategoryData,
      expenseByCategoryLabels,
      expenseByCategoryData,
      cumulativeDates: cumulativeDisplayDates,
      cumulativeData
    };
  };

  const {
    dates,
    incomeByDate,
    expenseByDate,
    incomeByCategoryLabels,
    incomeByCategoryData,
    expenseByCategoryLabels,
    expenseByCategoryData,
    cumulativeDates,
    cumulativeData
  } = processChartData();

  // Chart options and data
  const incomeVsExpenseChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Income',
        data: incomeByDate,
        backgroundColor: 'rgba(40, 167, 69, 0.6)',
        borderColor: 'rgb(40, 167, 69)',
        borderWidth: 1,
      },
      {
        label: 'Expense',
        data: expenseByDate,
        backgroundColor: 'rgba(220, 53, 69, 0.6)',
        borderColor: 'rgb(220, 53, 69)',
        borderWidth: 1,
      },
    ],
  };

  const incomeCategoryChartData = {
    labels: incomeByCategoryLabels,
    datasets: [
      {
        data: incomeByCategoryData,
        backgroundColor: [
          'rgba(40, 167, 69, 0.8)',
          'rgba(32, 201, 151, 0.8)',
          'rgba(23, 162, 184, 0.8)',
          'rgba(13, 110, 253, 0.8)',
          'rgba(0, 123, 255, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const expenseCategoryChartData = {
    labels: expenseByCategoryLabels,
    datasets: [
      {
        data: expenseByCategoryData,
        backgroundColor: [
          'rgba(220, 53, 69, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(108, 117, 125, 0.8)',
          'rgba(173, 181, 189, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const cumulativeEarningsData = {
    labels: cumulativeDates,
    datasets: [
      {
        label: 'Cumulative Earnings',
        data: cumulativeData,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-4 text-center">
        <p>No transaction data available to display charts.</p>
      </Card>
    );
  }

  return (
    <>
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="chart-title">Income vs Expense</h5>
              <div className="chart-container">
                <Bar data={incomeVsExpenseChartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="chart-title">Income by Category</h5>
              <div className="chart-container">
                <Pie data={incomeCategoryChartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="chart-title">Expense by Category</h5>
              <div className="chart-container">
                <Pie data={expenseCategoryChartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="chart-title">Cumulative Earnings</h5>
              <div className="chart-container">
                <Line data={cumulativeEarningsData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardCharts; 