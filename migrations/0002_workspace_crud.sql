CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  role VARCHAR(160) NOT NULL,
  email VARCHAR(255),
  availability VARCHAR(40) NOT NULL DEFAULT 'Disponible',
  workload INTEGER NOT NULL DEFAULT 0 CHECK (workload BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(40) NOT NULL DEFAULT 'Ideas',
  priority VARCHAR(20) NOT NULL DEFAULT 'Media',
  tag VARCHAR(80) NOT NULL DEFAULT 'Producto',
  story_points INTEGER NOT NULL DEFAULT 1 CHECK (story_points BETWEEN 0 AND 100),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  due_on DATE,
  assignee_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES workspace_sprints(id) ON DELETE SET NULL,
  figma_url TEXT,
  github_url TEXT,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  kind VARCHAR(60) NOT NULL DEFAULT 'Evento',
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(220) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Notas',
  content TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workspace_tasks_status_idx ON workspace_tasks(status);
CREATE INDEX workspace_tasks_sprint_idx ON workspace_tasks(sprint_id);
CREATE INDEX workspace_events_date_idx ON workspace_events(event_date);

INSERT INTO workspace_members (name, role, email, availability, workload) VALUES
('Daniel', 'Product Owner · Tech Lead', 'danieljimenezmejia42@gmail.com', 'Disponible', 82),
('Amy', 'Business Analyst', 'amyramirezhernandez20@gmail.com', 'Disponible', 64),
('Sarah', 'UX/UI Designer', NULL, 'En foco', 71),
('Jowell', 'Frontend Developer', NULL, 'En foco', 88);

INSERT INTO workspace_sprints (name, goal, starts_on, ends_on, status) VALUES
('Sprint 04', 'Entregar el núcleo administrativo seguro y validar el flujo principal del producto.', CURRENT_DATE, CURRENT_DATE + 14, 'active');

INSERT INTO workspace_tasks (code,title,description,status,priority,tag,story_points,progress,due_on,assignee_id,sprint_id)
SELECT seed.code,seed.title,seed.description,seed.status,seed.priority,seed.tag,seed.points,seed.progress,CURRENT_DATE + seed.days,m.id,s.id
FROM (VALUES
('MW-21','Flujo de onboarding empresarial','Definir y construir el onboarding empresarial.','Ideas','Media','Producto',8,10,10,'Amy'),
('MW-18','Modelo de permisos por organización','Diseñar permisos seguros por organización.','Backlog','Alta','Arquitectura',5,20,8,'Daniel'),
('MW-14','Sistema visual de Workspace','Consolidar componentes y estados visuales.','Sprint actual','Alta','Diseño',13,65,5,'Sarah'),
('MW-11','Dashboard operativo','Conectar indicadores del dashboard con datos reales.','En desarrollo','Alta','Frontend',8,72,4,'Jowell'),
('MW-09','Autenticación administrativa','Validar seguridad, sesiones y bloqueo.','Code Review','Crítica','Seguridad',5,85,3,'Daniel'),
('MW-07','Pruebas del formulario de contacto','Completar pruebas de integración.','Testing','Media','QA',3,90,2,'Amy'),
('MW-03','Landing pública Meridian','Landing pública publicada y verificada.','Completado','Alta','Web',8,100,1,'Jowell')
) AS seed(code,title,description,status,priority,tag,points,progress,days,owner)
JOIN workspace_members m ON m.name=seed.owner
CROSS JOIN workspace_sprints s WHERE s.status='active';
