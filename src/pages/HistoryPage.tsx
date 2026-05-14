export function HistoryPage() {
  return (
    <div className="page-pad">
      <h1 className="h1">Journal</h1>
      <div className="hf-row">
        <button type="button" className="hf on">
          7 jours
        </button>
        <button type="button" className="hf">
          Mois
        </button>
        <button type="button" className="hf">
          Exercice
        </button>
        <button type="button" className="hf">
          Programme
        </button>
      </div>

      <section className="hg">
        <h2 className="hg-lbl">Aujourd&apos;hui</h2>
        <article className="he card-flat">
          <span className="hdot live" aria-hidden />
          <div className="hi">
            <h3 className="hn">Séance A — En cours</h3>
            <p className="hm">Commencé à 09:12 · 3/6 exos</p>
          </div>
          <div className="hrpe">
            <span className="hrpe-v" style={{ color: 'var(--orange)' }}>
              ↺
            </span>
          </div>
        </article>
      </section>

      <section className="hg">
        <h2 className="hg-lbl">Hier · Lundi</h2>
        <article className="he card-flat">
          <span className="hdot" aria-hidden />
          <div className="hi">
            <h3 className="hn">Séance B · Poussée</h3>
            <p className="hm">42 min · 6 exos · 24 séries</p>
          </div>
          <div className="hrpe">
            <span className="hrpe-v">7</span>
            <span className="hrpe-l">RPE</span>
          </div>
        </article>
      </section>

      <section className="hg">
        <h2 className="hg-lbl">Dimanche</h2>
        <article className="he card-flat">
          <span className="hdot rest" aria-hidden />
          <div className="hi">
            <h3 className="hn">Repos</h3>
            <p className="hm">—</p>
          </div>
        </article>
      </section>

      <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }}>
        Voir tout l&apos;historique
      </button>
    </div>
  )
}
