const services = [
  { n: "01", title: "Agentes de IA", text: "Agentes que atienden, clasifican, redactan y ejecutan dentro de tus sistemas, con supervisión humana en cada punto crítico.", tags: ["Soporte", "Ventas", "Back office"], dark: true },
  { n: "02", title: "Automatización de procesos", text: "Flujos que conectan personas, datos y herramientas sin intervención manual.", tags: ["Workflows", "RPA"] },
  { n: "03", title: "Integraciones", text: "ERP, CRM, facturación y APIs propias hablando el mismo idioma.", tags: ["API", "ETL"] },
  { n: "04", title: "Software a medida", text: "Plataformas internas y productos digitales construidos para durar, con arquitectura clara y mantenimiento predecible.", tags: ["Web", "Plataformas", "Data"] },
];

function Logo() {
  return <a className="logo" href="#inicio" aria-label="Meridian, inicio"><span className="logo-mark"><i /></span><span>Meridian</span></a>;
}

function Header() {
  return <header className="nav-shell">
    <Logo />
    <nav aria-label="Navegación principal">
      <a href="#compania">Compañía</a><a href="#servicios">Qué hacemos</a><a href="#productos">Productos</a><a href="#tecnologia">Tecnología</a><a href="#proceso">Proceso</a>
    </nav>
    <a className="nav-cta" href="#contacto">Hablemos</a>
    <button className="menu" aria-label="Abrir menú"><span /><span /></button>
  </header>;
}

function Globe({ dark = false }: { dark?: boolean }) {
  return <div className={`globe ${dark ? "globe-dark" : ""}`}><img src="/meridian-globe.png" alt="Globo digital que simboliza tecnología centrada en las personas" /></div>;
}

export default function Home() {
  return <main id="inicio">
    <Header />
    <section className="hero grid-bg">
      <div className="hero-copy">
        <div className="eyebrow-pill"><b>Meridian</b><span>Agentes IA · Automatización</span></div>
        <h1>Innovación al<br />servicio del<br /><em>talento humano</em></h1>
        <p>Construimos software, agentes de inteligencia artificial e integraciones que amplifican la capacidad de los equipos. La tecnología existe para potenciar a las personas, nunca para reemplazarlas.</p>
        <div className="actions"><a className="button primary" href="#contacto">Iniciar un proyecto</a><a className="button ghost" href="#productos">Ver plataforma RSS</a></div>
        <div className="stats"><div><strong>120+</strong><small>Procesos automatizados</small></div><div><strong>18</strong><small>Integraciones nativas</small></div><div><strong>99.9%</strong><small>Disponibilidad</small></div></div>
      </div>
      <div className="hero-visual"><Globe /><div className="signal signal-a"><small>Agente de soporte</small><b><i /> activo</b></div><div className="signal signal-b"><small>Integración ERP</small><b><i /> sincronizada</b></div><div className="signal signal-c"><small>Horas devueltas al equipo</small><b><i /> 1.480 / mes</b></div></div>
    </section>
    <div className="ticker"><span>Operaciones</span><span>Finanzas</span><span>Manufactura</span><span>Retail</span><span>Logística</span><span>Salud</span><span>Educación</span><span>Servicios profesionales</span><span>Operaciones</span></div>

    <section id="compania" className="section about">
      <div className="kicker">Quiénes somos</div>
      <h2>Un estudio de ingeniería<br /><span>obsesionado</span> con el<br />trabajo bien hecho.</h2>
      <p className="lead">Meridian nace de una idea simple: las mejores empresas no son las que más automatizan, sino las que liberan a su gente para hacer el trabajo que realmente importa.</p>
      <div className="principles">
        <article><small>Misión</small><h3>Devolver tiempo a las personas</h3><p>Diseñamos software y agentes de IA que absorben la operación repetitiva para que los equipos se concentren en criterio, relación y estrategia.</p></article>
        <article><small>Visión</small><h3>Una capa inteligente para cada empresa</h3><p>Un futuro donde toda organización opere sobre infraestructura inteligente, segura y comprensible.</p></article>
        <article><small>Principio</small><h3>Tecnología con criterio humano</h3><p>Cada decisión de producto pasa por una pregunta: ¿esto hace más capaz a la persona que lo usa?</p></article>
      </div>
    </section>

    <section id="servicios" className="section services">
      <div className="kicker">Qué hacemos</div><h2>Capacidad técnica.<br /><span>Impacto operativo.</span></h2>
      <div className="service-grid">{services.map(s => <article key={s.n} className={s.dark ? "dark-card" : ""}><small>{s.n}</small><div><h3>{s.title}</h3><p>{s.text}</p><div className="tags">{s.tags.map(t => <span key={t}>{t}</span>)}</div></div></article>)}</div>
    </section>

    <section id="productos" className="product grid-bg">
      <div className="kicker">Productos</div>
      <div className="product-heading"><div><h2>RSS — <span>la sala de control</span><br />de tu operación.</h2><p>Un solo lugar para orquestar agentes, procesos e integraciones. Visibilidad total, control humano y trazabilidad de cada decisión automatizada.</p></div><a className="button ghost" href="#contacto">Solicitar demo →</a></div>
      <div className="dashboard">
        <aside><b>RSS Console</b><span>Resumen</span><strong>Agentes</strong><span>Procesos</span><span>Integraciones</span><span>Auditoría</span><div><small>Consumo mensual</small><em>64%</em></div></aside>
        <div className="dash-main"><header><h3>Agentes activos <small>Últimas 24 horas</small></h3><span>Tiempo real</span></header>
          <div className="metrics"><div><small>Ejecuciones</small><b>12.482</b></div><div><small>Éxito</small><b>99,2%</b></div><div><small>Escalados</small><b>156</b></div><div><small>Horas ahorradas</small><b>1.480</b></div></div>
          <div className="bars">{[42,58,49,72,63,81,68,96,77,104,89,111,84,101].map((h,i)=><i key={i} style={{height:`${h}px`}} />)}</div>
          <div className="rows"><p><i />Agente de soporte <span>Resolvió 84 tickets</span></p><p><i />Conciliación bancaria <span>1.204 registros cruzados</span></p><p><i className="muted" />Onboarding RRHH</p></div>
        </div><div className="agent-toast"><small>Agente · Cobranza</small><p>412 recordatorios enviados, 38 escalados a un humano.</p><i /></div>
      </div>
    </section>

    <section id="tecnologia" className="section process">
      <div className="kicker">Nuestro proceso</div><h2>De una conversación<br /><span>a producción.</span></h2>
      <div className="process-row"><article><small>01 · Entender</small><strong>30 min</strong><p>Mapeamos el problema real, sin presentaciones eternas.</p></article><article><small>02 · Diseñar</small><strong>5 días</strong><p>Prototipo funcional y una ruta clara de implementación.</p></article><article id="proceso"><small>03 · Operar</small><strong>24/7</strong><p>Operación continua, medible y supervisada.</p></article><article><small>04 · Entregar</small><strong>11 días</strong><p>De la idea al primer flujo en producción.</p></article></div>
      <blockquote>“Dejamos de perseguir información. Ahora el sistema la trae, y el equipo decide.”<small>Dirección de Operaciones · Cliente del sector industrial</small></blockquote>
    </section>

    <section id="contacto" className="cta">
      <div className="cta-art"><Globe dark /></div>
      <div className="cta-copy"><div className="kicker light">Empecemos</div><h2>Tu equipo ya es bueno.<br /><span>Démosle mejores<br />herramientas.</span></h2><p>Conversemos 30 minutos sobre un proceso concreto. Salimos con un diagnóstico claro y una ruta posible.</p><div className="actions center"><a className="button white" href="mailto:hola@meridian.com">Agendar una conversación</a><a className="button outline" href="#productos">Explorar RSS</a></div></div>
    </section>
    <footer><div className="footer-grid"><div><Logo /><p>Innovación al servicio del talento humano.</p></div><div><small>Compañía</small><a href="#compania">Quiénes somos</a><a href="#compania">Misión</a><a href="#compania">Valores</a></div><div><small>Soluciones</small><a href="#servicios">Agentes IA</a><a href="#servicios">Automatización</a><a href="#servicios">Integraciones</a></div><div><small>Productos</small><a href="#productos">RSS Console</a><a href="#contacto">Demo</a><a href="#productos">Documentación</a></div><div><small>Contacto</small><a href="mailto:hola@meridian.com">hola@meridian.com</a><a href="#">LinkedIn</a><a href="#">X</a></div></div><div className="legal"><span>© 2026 Meridian. Todos los derechos reservados.</span><span>Privacidad · Términos · Seguridad</span></div><div className="wordmark">MERIDIAN</div></footer>
  </main>;
}
