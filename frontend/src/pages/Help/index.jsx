import { useState } from 'react'
import {
  BookOpen, HelpCircle, Share2, TrendingUp, Landmark, Boxes,
  Settings, ShieldCheck, Search, Activity, Users, FileText, ArrowRight,
  Info, Sparkles, ShoppingBag, Coins, Clock, MapPin, CreditCard, Tag, Truck
} from 'lucide-react'

export default function Help() {
  const [activeSection, setActiveSection] = useState('architecture')

  const menuItems = [
    { id: 'architecture', label: '1. Store Architecture', icon: BookOpen },
    { id: 'catalog', label: '2. Catalog & Product Mgmt', icon: Tag },
    { id: 'inventory', label: '3. Inventory & FIFO', icon: Boxes },
    { id: 'taxation', label: '4. UAE VAT & TRN Compliance', icon: Landmark },
    { id: 'fulfillment', label: '5. Order Fulfillment & COD', icon: ShoppingBag },
    { id: 'rfm-loyalty', label: '6. Customer CRM & Loyalty', icon: Users },
    { id: 'social-metrics', label: '7. Social Media & Marketing', icon: Share2 },
  ]

  const sections = {
    architecture: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <BookOpen size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Store Architecture & System Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            An overview of how Pommastore keeps your live customer storefront and administration dashboard in perfect real-time sync.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Pommastore is a unified luxury e-commerce and ERP platform connecting your storefront with your central administration suite. It seamlessly coordinates product catalog management, real-time inventory tracking, UAE VAT calculations, order fulfillment, customer CRM, and analytics.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>What is the purpose of this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The primary goal is **zero operational delay and 100% data accuracy**. When a customer places an order online, stock levels are instantly deducted FIFO-style, UAE 5% VAT is dynamically computed, loyalty points are credited, and order status transitions are tracked live.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>How to use this?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            As a store manager, use the left navigation sidebar to access modules:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Catalog Manager:</strong> Create and edit SKUs, manage pricing, upload media, set cover photos, and assign tax modes.</li>
              <li><strong>Inventory:</strong> Receive new stock batches with cost prices and monitor warehouse quantities.</li>
              <li><strong>Orders & CRM:</strong> Manage online/POS orders, update fulfillment statuses, track shipments, and view customer purchase profiles.</li>
              <li><strong>Analytics:</strong> Review revenue reports, tax summaries, loyalty tiers, and traffic origins.</li>
              <li><strong>Settings:</strong> Configure base currency (AED), TRN details, delivery rules, and CMS layouts.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>System Data Flow</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>Customer Action:</strong> Customer selects items, applies promo codes/loyalty points, and checks out.</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>Backend Processing:</strong> API validates stock, locks inventory batches FIFO, computes 5% UAE VAT, and generates order reference.</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowRight size={12} color="var(--gold)" />
              <span><strong>Real-time Update:</strong> Admin dashboard receives new order alert; stock levels update across storefront instantly.</span>
            </div>
          </div>
        </div>
      </div>
    ),
    catalog: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Tag size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Catalog & Product Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Complete guide on managing SKUs, variant pricing, cover photo selections, 3D assets, and tax modes.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>1. Product & Variant Creation</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Each product contains one or more size variants (e.g. 50ml, 100ml EDP). Variants hold unique SKU codes, selling prices, compare-at prices, cost prices, and loyalty point reward values.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>2. Product Media & Cover Photo Controls</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            In Catalog Manager, each product thumbnail includes interactive media controls:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>★ Set Cover:</strong> Instantly sets the selected image as the primary cover photo across shop grid and product detail pages.</li>
              <li><strong>◄ Left / ► Right Arrows:</strong> Easily reorder product gallery photos into your preferred sequence.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>3. Tax Mode Assignment (Inclusive vs Exclusive)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            You can configure tax mode per variant SKU:
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Exclusive Tax:</strong> Base selling price does not include VAT. 5% UAE VAT is calculated and added on top at checkout.</li>
              <li><strong>Inclusive Tax:</strong> Selling price already includes 5% UAE VAT. The system extracts taxable base (`Price / 1.05`) automatically for tax invoices.</li>
              <li><strong>Zero-Rated:</strong> Exempt from VAT (0%).</li>
            </ul>
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
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>FIFO stock deduction:</strong> When a customer orders, the system automatically checks your oldest batch of stock for that variant and deducts quantities from it.</li>
              <li><strong>Inventory Turnover Ratio:</strong> Measures how fast your warehouse stock sells. It divides the total cost of goods sold by your average stock value on hand.</li>
              <li><strong>Dead Stock:</strong> Automatically flags stock batches that have sat in your warehouse for **over 90 days with zero sales** so you can run discount campaigns to liquidate them.</li>
            </ul>
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
    taxation: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Landmark size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> UAE VAT & TRN Compliance (5.0%)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Overview of automated 5% UAE VAT calculations, TRN tax invoice generation, and product-level tax rules.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>1. Standard UAE VAT Rate (5.0%)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Pommastore dynamically calculates the standard **5.0% UAE VAT** across cart and checkout. In accordance with UAE tax laws, VAT is calculated **exclusively on product price / subtotal**, excluding base logistics and shipping fees.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>2. Per-SKU Tax Modes</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Exclusive Mode:</strong> `Taxable Amount = Product Subtotal`, `VAT = Subtotal × 0.05`. Total payable is Subtotal + VAT + Shipping.</li>
              <li><strong>Inclusive Mode:</strong> `Taxable Amount = Subtotal / 1.05`, `VAT = Subtotal - Taxable Amount`. Total payable is Subtotal + Shipping.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>3. TRN Tax Invoicing & Compliance</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Configure your **15-digit TRN Number (Tax Registration Number)** under **Settings → Company Profile**. Entering your TRN automatically embeds statutory compliance headers on transactional invoices, receipts, and order detail modals.
          </p>
        </div>
      </div>
    ),
    fulfillment: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <ShoppingBag size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Order Fulfillment & Payment Options
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Manage order lifecycles, payment methods (Cards & Cash on Delivery), and shipping tracking.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>1. Supported UAE Payment Gateways</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Credit / Debit Card:</strong> Visa, Mastercard, Amex, Apple Pay via Stripe gateway integration.</li>
              <li><strong>Cash on Delivery (COD):</strong> Doorstep cash / card payment upon physical delivery.</li>
              <li><strong>Direct Bank Transfer:</strong> Corporate wire transfers for bulk / POS transactions.</li>
            </ul>
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>2. Order Status Lifecycle</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Orders transition through distinct stages:
            <br />
            `Pending` → `Confirmed` → `Processing` → `Packed` → `Shipped` → `Out for Delivery` → `Delivered / Completed`.
            <br /><br />
            Updating order status triggers automatic customer notifications via email and SMS.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>3. Shipment AWB Tracking</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Assign AWB consignment tracking numbers inside **Orders & CRM**. Customers can track parcel progress live on `/track-order`.
          </p>
        </div>
      </div>
    ),
    'rfm-loyalty': (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            <Users size={22} color="var(--gold)" style={{ verticalAlign: 'middle', marginRight: 8 }} /> Customer CRM & Loyalty Rewards
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Maximize customer retention using behavioral customer tiers, points rewards, and checkout redemption.
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
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Customer Segments:</strong> Categorizes buyers into groups like **"Champions"** (recent, frequent high-spenders), **"Loyal"** (frequent buyers), or **"Hibernating"** (long time since last purchase).</li>
              <li><strong>Loyalty Statuses:</strong> Customers are automatically awarded **Bronze**, **Silver**, or **Gold** status as their total spent increases.</li>
              <li><strong>Point Rewards:</strong> Customers earn points on their net spent total. These points act like direct cash discounts on their next purchase during storefront checkout (e.g., 1 point offsets AED 1 on their invoice).</li>
            </ul>
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
              <li><strong>Total Interactions (Clicks):</strong> The number of store visits generated from that specific social network.</li>
              <li><strong>Click-Through Rate (CTR):</strong> The percentage of viewers who clicked your links to visit your store.</li>
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
