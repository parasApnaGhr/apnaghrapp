import { FiMail, FiMessageCircle, FiPhone } from 'react-icons/fi'
import ListLink from '../components/ui/ListLink'
import Panel from '../components/ui/Panel'
import SupportAction from '../components/ui/SupportAction'
import { legalItems } from '../data/mockData'

const faqs = [
  'How do I cancel a visit?',
  'Can I add properties after booking?',
  "What if the rider doesn't arrive?",
  'How does the trip PIN work?',
  'When are visit fees refunded?',
]

function SupportScreen() {
  return (
    <div className="screen support-layout">
      <section>
        <h1>Help & support</h1>
        <div className="support-actions">
          <SupportAction icon={<FiPhone />} title="Call us" text="9 AM - 9 PM IST" />
          <SupportAction icon={<FiMessageCircle />} title="WhatsApp" text="Typical reply: 4 min" />
          <SupportAction icon={<FiMail />} title="Email" text="help@apnaghr.in" />
        </div>
        <Panel title="Frequently asked">
          {faqs.map((item, index) => (
            <div className="faq-row" key={item}>
              <strong>{item}</strong>
              <span>{index === 0 ? '-' : '+'}</span>
              {index === 0 && (
                <p>
                  Visit fees are fully refundable up to 4h before pickup. After that,
                  only the rider fee is non-refundable.
                </p>
              )}
            </div>
          ))}
        </Panel>
      </section>
      <Panel title="Legal & policies">
        {legalItems.map((item) => (
          <ListLink key={item} label={item} />
        ))}
      </Panel>
    </div>
  )
}

export default SupportScreen
