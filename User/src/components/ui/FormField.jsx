function FormField({ label, icon, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div>
        <input {...props} />
        {icon}
      </div>
    </label>
  )
}

export default FormField
