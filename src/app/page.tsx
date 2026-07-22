import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ArrowIcon } from "@/components/icons";
import { installationStatus } from "@/lib/services/installation";

const sampleRequests = [
  { initials: "AK", name: "Anna Kalniņa", company: "Ziemeļu birojs", color: "coral", title: "Meklēju kontaktu ilgtspējas vadībā", text: "Vēlos iepazīties ar ražošanas uzņēmumu ilgtspējas vai ESG vadītājiem Baltijā.", tags: ["Ražošana", "Baltija"] },
  { initials: "JM", name: "Jānis Meiers", company: "Meiers Finance", color: "sage", title: "E-komercijas uzņēmumi izaugsmes posmā", text: "Meklēju uzņēmumus ar vismaz 20 darbiniekiem, kuriem aktuāla finanšu procesu sakārtošana.", tags: ["E-komercija", "Finanses"] },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await installationStatus();
  if (!status.installed) redirect("/setup");
  return (
    <main className="landing">
      <nav className="landing-nav wrap">
        <Brand />
        <div className="nav-actions"><a href="#ka-tas-strada">Kā tas strādā</a><Link className="button button-dark button-small" href="/login">Ieiet sistēmā <ArrowIcon /></Link></div>
      </nav>

      <section className="hero wrap">
        <div className="eyebrow"><span /> Slēgta un uzticama kopiena</div>
        <h1>Īstais kontakts ir<br />tuvāk, nekā šķiet.</h1>
        <p>Publicē konkrētu pieprasījumu un ļauj savai kopienai palīdzēt atrast īsto cilvēku, uzņēmumu vai iespēju.</p>
        <div className="hero-actions"><Link className="button button-accent" href="/login">Atvērt pieprasījumus <ArrowIcon /></Link><span>Autorizācija ar WhatsApp</span></div>
      </section>

      <section className="preview-section">
        <div className="preview-window wrap">
          <div className="preview-top"><span className="preview-brand"><b>24</b> aktīvi pieprasījumi</span><span>Atjaunots šodien</span></div>
          <div className="preview-grid">
            {sampleRequests.map((person) => (
              <article className="preview-person" key={person.name}>
                <header><span className={`avatar ${person.color}`}>{person.initials}</span><div><strong>{person.name}</strong><small>{person.company}</small></div><b className="count">1</b></header>
                <div className="preview-request"><span className="request-kicker">Aktuāls pieprasījums</span><h2>{person.title}</h2><p>{person.text}</p><div className="tag-row">{person.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ka-tas-strada" className="how wrap">
        <div><span className="section-number">01</span><h2>Ieraksti to,<br />ko tieši meklē.</h2></div>
        <ol>
          <li><b>Konkrēts pieprasījums</b><span>Apraksti uzņēmumu, cilvēku vai iespēju, kuru vēlies atrast.</span></li>
          <li><b>Sava uzticamā grupa</b><span>Tavu ierakstu redz tikai reģistrēti kopienas biedri.</span></li>
          <li><b>Savieno kopienas</b><span>Pēc izvēles dalies ar uzticamām, tieši savienotām grupām.</span></li>
        </ol>
      </section>
    </main>
  );
}
