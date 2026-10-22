import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardCard } from '../../components/common/DashboardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { paymentService } from '../../services/paymentService';
import { clearanceService } from '../../services/clearanceService';

export const CashierDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [clearances, setClearances] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [payList, clrList] = await Promise.all([
          paymentService.getPayments(),
          clearanceService.getClearances()
        ]);
        setPayments(payList);
        setClearances(clrList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Cashier Office Dashboard..." />;
  }

  const pendingPayments = payments.filter((p) => p.status === 'Pending');
  const verifiedPayments = payments.filter((p) => p.status === 'Verified');
  const rejectedPayments = payments.filter((p) => p.status === 'Rejected');
  const pendingCashierClearance = clearances.filter((c) => {
    const cashierSign = c.signoffs.find((s) => s.officeName.toLowerCase().includes('cashier'));
    return cashierSign && cashierSign.status === 'Pending';
  });

  const totalVerifiedCollection = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Cashier Dashboard"
        subtitle="Review payments and financial clearances."
      />

      {/* Dashboard Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Pending Verification"
            value={pendingPayments.length}
            subtitle="Uploaded deposit slips"
            icon="bi-hourglass-split"
            color="warning"
            onClick={() => navigate('/cashier/payments')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Verified Payments"
            value={verifiedPayments.length}
            subtitle={`Total: ₱${totalVerifiedCollection.toLocaleString()}`}
            icon="bi-patch-check-fill"
            color="primary"
            onClick={() => navigate('/cashier/payments')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Rejected Payments"
            value={rejectedPayments.length}
            subtitle="Illegible / Mismatch"
            icon="bi-x-octagon-fill"
            color="danger"
            onClick={() => navigate('/cashier/payments')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Clearance Queue"
            value={pendingCashierClearance.length}
            subtitle="Finance review"
            icon="bi-clipboard-check"
            color="info"
            onClick={() => navigate('/cashier/clearance')}
          />
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="pnc-card">
        <div className="pnc-card-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-cash-coin text-success"></i>
            <span>Recent Transaction Slips</span>
          </div>
          <Link to="/cashier/payments" className="btn btn-sm btn-link text-decoration-none text-success p-0">
            Go to Verification Queue
          </Link>
        </div>
        <div className="pnc-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-pnc align-middle mb-0">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Method & Ref</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold font-monospace text-dark">{p.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{p.studentName}</div>
                      <div className="small text-muted font-monospace">{p.studentNumber}</div>
                    </td>
                    <td className="fw-bold text-success">₱{p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div className="small text-dark">{p.paymentMethod}</div>
                      <div className="small text-muted font-monospace">{p.referenceNumber}</div>
                    </td>
                    <td className="small text-muted">{p.paymentDate}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <Link to="/cashier/payments" className="btn btn-xs btn-outline-primary py-1 px-2">
                        Inspect Slip
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
