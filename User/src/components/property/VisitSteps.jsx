function Step({ number, title, text }) {
  return (
    <div>
      <strong>{number}</strong>
      <b>{title}</b>
      <span>{text}</span>
    </div>
  )
}

function VisitSteps() {
  return (
    <div className="steps">
      <Step number="1" title="Book visit" text="Book visit and pay refundable fee" />
      <Step number="2" title="Rider picks you" text="Pickup at chosen time" />
      <Step number="3" title="Tour & decide" text="Share PIN, decide" />
    </div>
  )
}

export default VisitSteps
