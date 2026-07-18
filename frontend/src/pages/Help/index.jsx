import { useState } from 'react'
import {
  BookOpen, HelpCircle, Share2, TrendingUp, Landmark, Boxes,
  Settings, ShieldCheck, Search, Activity, Users, FileText, ArrowRight,
  Info, Sparkles, ShoppingBag, Coins, Clock, MapPin
} from 'lucide-react'

export default function Help() {
  const [activeSection, setActiveSection] = useState('architecture')

  const menuItems = [
    { id: 'architecture', label: '1. Store Architecture', icon: BookOpen },
    { id: 'social-metrics', label: '2. Social Media Metrics', icon: Share2 },
    { id: 'taxation', label: '3. GST & Tax Compliance', icon: Landmark },
    { id: 'inventory', label: '4. Inventory & FIFO', icon: Boxes },
    { id: 'rfm-loyalty', label: '5. Customer & Loyalty Tiers', icon: Users },
  ]

  const sections = {
    architecture: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <BookOpen size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Store Architecture & System Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            An overview of how Pommastore keeps your customer storefront and administration dashboard in perfect sync.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Pommastore is an all-in-one business software that connects your store administration console with your live customer shopping site at **`pommastore.com`**. It manages everything from adding products to catalog pages, tracking sales, updating inventory counts, and analyzing buyer trends.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is the purpose of this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The primary purpose is to ensure **zero delays and total accuracy** in your store operations. When a customer makes a purchase on `pommastore.com`, the system instantly updates stock levels, calculates correct sales taxes, awards loyalty points, and updates your executive dashboard without requiring manual entries.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How to use this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            You do not need to manage any technical servers. As a store manager, you simply use the sidebar links to list new catalog items, review fulfillment orders, and verify financial analytics. The system handles all background data syncing automatically.
          </p>
        </div>

        {/* BUSINESS WORKFLOW */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>System Workflow (How Data Flows)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>When:</strong> Customer visits your store page, registers, or completes a product purchase.</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>Where:</strong> Customer actions occur on <code style={{ color: '#fff' }}>pommastore.com</code>, updating records instantly in your Admin console.</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>What:</strong> Inventory stock is deducted, marketing data is generated, and customer tiers shift automatically.</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>How:</strong> Relayed securely via encrypted cloud APIs to ensure your executive dashboard is always 100% accurate.</span>
            </div>
          </div>
        </div>
      </div>
    ),
    'social-metrics': (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Share2 size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Social Media & Campaign Metrics
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Understand visitor interactions, customer acquisition costs, and storefront referral tracking for Instagram, Facebook, and LinkedIn.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The **Social Ecosystem Metrics** is a marketing tool inside your Analytics page that tracks customer engagement:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Total Interactions (Clicks)</strong>: The number of store visits generated from that specific social network.</li>
              <li><strong>Click-Through Rate (CTR)</strong>: The percentage of viewers who clicked your links to visit your store.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is the purpose of this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To show you exactly which social media channel drives the most revenue and engagement. This helps you identify where your target audience lives so you can spend your advertising budget wisely.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How is this calculated?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To ensure zero fake placeholder metrics, the dashboard calculates these values based on actual storefront activities:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Interactions (Clicks)</strong>: Calculated dynamically based on the volume of real customer registrations and orders driven by that platform. If there is no activity, the clicks correctly display as `0` without fake seed data.</li>
              <li><strong>Click-Through Rate (CTR)</strong>: Uses target industry benchmarks (Instagram: `3.2%`, Facebook: `1.5%`, LinkedIn: `3.0%`) to display active user interest.</li>
              <li><strong>Avg. CAC (Customer Acquisition Cost)</strong>: The average marketing cost spent to acquire a single customer. This is calculated dynamically by dividing your **total promotional order discounts** by your **total customer registrations**.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How to use this? (Referral Setup)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To automatically track customer orders from social media, simply append tracking tags to your bio profiles or ad links leading to **`pommastore.com`**:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--gold-bright)' }}>
              <li>Instagram bio link: <strong>https://pommastore.com/?ref=instagram</strong></li>
              <li>Facebook ad link: <strong>https://pommastore.com/?ref=facebook</strong></li>
              <li>LinkedIn post link: <strong>https://pommastore.com/?ref=linkedin</strong></li>
            </ul>
            When a customer clicks these links and checks out, their order is permanently attributed to that social media platform.
          </p>
        </div>
      </div>
    ),
    taxation: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Landmark size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> GST & Tax Compliance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Overview of automated GST calculations, intrastate/interstate tax splits, and GSTR-1 compliance reporting.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Pommastore includes an automated tax calculation system that splits your sales taxes into **CGST** (Central tax), **SGST** (State tax), and **IGST** (Integrated cross-state tax) based on where your customer lives.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is the purpose of this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To save your accountant hours of manual work and keep your business fully compliant. Government tax filing requires you to aggregate transactions based on their interstate destination state. Pommastore handles this automatically.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How is this calculated?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The system compares the location of your shipping warehouse with the destination shipping address provided by the customer:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Intrastate Sales (Same State)</strong>: If your shipping warehouse and the customer are in the same state (e.g., both in Maharashtra), the tax is divided equally between **CGST** and **SGST**.</li>
              <li><strong>Interstate Sales (Cross State)</strong>: If the warehouse and the customer are in different states (e.g., Maharashtra to Gujarat), the tax is assigned fully to **IGST**.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How to use this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Make sure your warehouses are created with the correct state. When customers order, the correct GST split is applied to their invoices automatically. You can view these summaries under the **Tax & Compliance** tab in Analytics and click **"Master PDF Report"** to export files for monthly tax filing.
          </p>
        </div>
      </div>
    ),
    inventory: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Boxes size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Inventory Management & FIFO Costing
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Understand inventory batching, product turnover tracking, and how stale or dead stock is automatically flagged.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            An inventory management tool that tracks your items in specific date-stamped batches rather than simple count tallies. It implements a **FIFO (First-In, First-Out)** system, meaning the oldest stock batch received is sold to customers first.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is the purpose of this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To calculate your **true profit margins** accurately. Since wholesale prices of products and materials change over time, the system compares the exact purchase cost of the item in that batch against its final sale price to show correct margins. It also helps you locate stale stock.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How is this calculated?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            *   <strong>FIFO stock deduction</strong>: When a customer orders, the system automatically checks your oldest batch of stock for that variant and deducts quantities from it.
            *   <strong>Inventory Turnover Ratio</strong>: Measures how fast your warehouse stock sells. It divides the total cost of goods sold by your average stock value on hand.
            *   <strong>Dead Stock</strong>: Automatically flags stock batches that have sat in your warehouse for **over 90 days with zero sales** so you can run discount campaigns to liquidate them.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How to use this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            When receiving new catalog inventory, create a new stock batch in the **Inventory** manager and input its wholesale purchase cost. The system will handle the rest. Review the **Inventory Health** analytics tab to find dead stock alerts and monitor turnover metrics.
          </p>
        </div>
      </div>
    ),
    'rfm-loyalty': (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Users size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Customer Segmentation & Loyalty Tiers
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Maximize customer retention using behavioral customer tiers, points rewards, and checkouts redemption.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            A CRM (Customer Relationship Management) tool that segments your customers based on purchase behavior (Recency, Frequency, and Monetary spend) and awards loyalty statuses.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is the purpose of this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To keep buyers coming back. Instead of sending generic promotions to everyone, you can offer targeted campaigns (like high-value discount coupons to "at-risk" big spenders, or loyalty points promotions to VIP customers).
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How is this calculated?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            *   <strong>Customer Segments</strong>: Categorizes buyers into groups like **"Champions"** (recent, frequent high-spenders), **"Loyal"** (frequent buyers), or **"Hibernating"** (long time since last purchase).
            *   <strong>Loyalty Statuses</strong>: Customers are automatically awarded **Bronze**, **Silver**, or **Gold** status as their total spent increases.
            *   <strong>Point Rewards</strong>: Customers earn points on their net spent total. These points act like direct cash discounts on their next purchase during storefront checkout (e.g., 1 point offsets AED 1 on their invoice).
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How to use this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Browse customer lists and behavioral clusters under the **Customer Report** tab in Analytics. You can check customer point balances inside the **CRM & Orders** pages. Customers can view and redeem their points balances seamlessly when shopping on `pommastore.com`.
          </p>
        </div>
      </div>
    ),
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
          <HelpCircle size={24} />
        </div>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>Pommastore System Manual</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Reference manual detailing operations and business flows in Pommastore ERP</p>
        </div>
      </div>

      {/* TWO COLUMN GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* INTERACTIVE LEFT MENU */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 12, position: 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', padding: '10px 14px 6px', letterSpacing: '0.15em' }}>DOCUMENT DIRECTORY</p>
          {menuItems.map(item => {
            const IconComp = item.icon
            const isSelected = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`nav-item ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  background: isSelected ? 'var(--gold-glow)' : 'transparent',
                  border: isSelected ? '1px solid var(--gold-border)' : '1px solid transparent',
                  color: isSelected ? 'var(--gold-bright)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <IconComp size={16} />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* ACTIVE SECTION DISPLAY */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, minHeight: 480 }}>
          {sections[activeSection]}
        </div>

      </div>
    </div>
  )
}
