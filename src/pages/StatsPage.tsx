export function StatsPage() {
  const bars = [34, 42, 50, 44, 56, 52, 63, 72]
  return (
    <div className="page-pad">
      <h1 className="h1">Progression</h1>

      <div className="sg">
        <div className="scard scard-ac card-flat">
          <p className="scard-lbl">Cette semaine</p>
          <p className="scard-val">4</p>
          <p className="scard-sub">séances / 4 prévues</p>
        </div>
        <div className="scard card-flat">
          <p className="scard-lbl">Volume</p>
          <p className="scard-val">1 842</p>
          <p className="scard-sub">reps ce mois</p>
        </div>
        <div className="scard card-flat">
          <p className="scard-lbl">Durée moy.</p>
          <p className="scard-val">41m</p>
          <p className="scard-sub">par séance</p>
        </div>
        <div className="scard card-flat">
          <p className="scard-lbl">Assiduité</p>
          <p className="scard-val">87%</p>
          <p className="scard-sub">sur 30 jours</p>
        </div>
      </div>

      <section className="chart-card card">
        <h2 className="cc-title">Tractions · Reps / séance</h2>
        <p className="cc-sub">8 dernières séances</p>
        <div className="chart">
          {bars.map((h, i) => {
            const hi = h >= 56 && h < 72
            const mx = h >= 72
            return (
              <div key={i} className="cb-w">
                <div className={`cb${hi ? ' hi' : ''}${mx ? ' mx' : ''}`} style={{ height: h }} />
                <span className="cx mono">S{i + 1}</span>
              </div>
            )
          })}
        </div>
      </section>

      <p className="eyebrow" style={{ margin: '16px 0 8px' }}>
        Records personnels
      </p>
      <div className="rec-card card">
        {[
          ['Tractions', '14 reps', '+2'],
          ['Pompes déclinées', '18 reps', '+3'],
          ['Dips corps', '12 reps', '+1'],
          ['Squat bulgare', '16 reps', '+4'],
        ].map(([name, val, d]) => (
          <div key={String(name)} className="rr">
            <span className="rex">{name}</span>
            <span>
              <span className="rv mono">{val}</span>
              <span className="rdelta">{d}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
