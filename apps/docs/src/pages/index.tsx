import { useState } from 'react';
import { Database, MessageSquare, Globe, Server, Shield, GitBranch } from 'lucide-react';

const ArchitectureDiagram = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const layers = [
    {
      name: 'Capa de Presentación',
      color: 'bg-blue-500',
      components: [
        { name: 'Dashboard Empresas', desc: 'Panel de control para cada empresa' },
        { name: 'Configurador de Bots', desc: 'Editor visual de flujos' },
        { name: 'Monitor de Conversaciones', desc: 'Vista en tiempo real' },
        { name: 'Gestión de QR', desc: 'Conexión de WhatsApp' }
      ]
    },
    {
      name: 'Capa de Aplicación',
      color: 'bg-green-500',
      components: [
        { name: 'API Gateway', desc: 'Punto de entrada único' },
        { name: 'Auth Service', desc: 'JWT + Multi-tenant' },
        { name: 'Bot Manager', desc: 'CRUD de configuraciones' },
        { name: 'WebSocket Server', desc: 'Comunicación en tiempo real' }
      ]
    },
    {
      name: 'Capa de Negocio',
      color: 'bg-purple-500',
      components: [
        { name: 'Session Manager', desc: 'Gestión de instancias WhatsApp' },
        { name: 'Message Router', desc: 'Enrutamiento de mensajes' },
        { name: 'Flow Engine', desc: 'Motor de flujos conversacionales' },
        { name: 'Analytics Engine', desc: 'Procesamiento de métricas' }
      ]
    },
    {
      name: 'Capa de Integración',
      color: 'bg-yellow-500',
      components: [
        { name: 'WhatsApp.js Client', desc: 'Múltiples instancias' },
        { name: 'Queue Manager', desc: 'Cola de mensajes (Bull/Redis)' },
        { name: 'File Storage', desc: 'Medios y adjuntos' },
        { name: 'External APIs', desc: 'Integraciones externas' }
      ]
    },
    {
      name: 'Capa de Datos',
      color: 'bg-red-500',
      components: [
        { name: 'MongoDB', desc: 'Base de datos principal' },
        { name: 'Redis', desc: 'Cache y sesiones' },
        { name: 'Cloud Storage', desc: 'AWS S3 / Cloudinary' },
        { name: 'Logs Database', desc: 'Registro de eventos' }
      ]
    }
  ];

  const frontendStructure = {
    name: 'Frontend (React)',
    folders: [
      {
        name: 'src/',
        items: [
          { name: 'components/', desc: 'Componentes reutilizables' },
          { name: 'pages/', desc: 'Páginas principales' },
          { name: 'services/', desc: 'Llamadas API' },
          { name: 'store/', desc: 'Estado global (Redux/Zustand)' },
          { name: 'hooks/', desc: 'Custom hooks' },
          { name: 'utils/', desc: 'Utilidades y helpers' },
          { name: 'contexts/', desc: 'Context providers' },
          { name: 'layouts/', desc: 'Layouts de página' }
        ]
      }
    ]
  };

  const backendStructure = {
    name: 'Backend (Node.js + Express)',
    folders: [
      {
        name: 'src/',
        items: [
          { name: 'controllers/', desc: 'Lógica de endpoints' },
          { name: 'models/', desc: 'Schemas de MongoDB' },
          { name: 'services/', desc: 'Lógica de negocio' },
          { name: 'routes/', desc: 'Definición de rutas' },
          { name: 'middlewares/', desc: 'Auth, validation, etc.' },
          { name: 'config/', desc: 'Configuraciones' },
          { name: 'whatsapp/', desc: 'Gestor de instancias' },
          { name: 'utils/', desc: 'Helpers y utilidades' },
          { name: 'queues/', desc: 'Colas de mensajes' },
          { name: 'sockets/', desc: 'WebSocket handlers' }
        ]
      }
    ]
  };

  const dataModels = [
    {
      name: 'Company',
      fields: ['name', 'email', 'plan', 'apiKey', 'isActive', 'createdAt']
    },
    {
      name: 'Bot',
      fields: ['companyId', 'name', 'phoneNumber', 'qrCode', 'status', 'config']
    },
    {
      name: 'Flow',
      fields: ['botId', 'name', 'triggers', 'nodes', 'isActive']
    },
    {
      name: 'Conversation',
      fields: ['botId', 'userId', 'messages[]', 'status', 'createdAt']
    },
    {
      name: 'Message',
      fields: ['conversationId', 'content', 'type', 'direction', 'timestamp']
    },
    {
      name: 'User',
      fields: ['companyId', 'email', 'password', 'role', 'permissions']
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 to-slate-800 p-16">

      <div className="max-w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            WhatsApp Multi-Tenant Bot Platform
          </h1>
          <p className="text-red-600">Arquitectura Empresarial Completa</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['overview', 'frontend', 'backend', 'database'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tab === 'overview' && '🏗️ Arquitectura'}
              {tab === 'frontend' && '⚛️ Frontend'}
              {tab === 'backend' && '🚀 Backend'}
              {tab === 'database' && '💾 Base de Datos'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {layers.map((layer, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${layer.color} w-3 h-3 rounded-full`}></div>
                  <h3 className="text-xl font-bold text-white">{layer.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {layer.components.map((comp, i) => (
                    <div key={i} className="bg-slate-700 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-1">{comp.name}</h4>
                      <p className="text-slate-400 text-sm">{comp.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'frontend' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="text-blue-400" size={32} />
              <h2 className="text-2xl font-bold text-white">Estructura del Frontend</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <GitBranch size={20} />
                  Estructura de Carpetas
                </h3>
                <div className="space-y-2 font-mono text-sm">
                  {frontendStructure.folders[0].items.map((item, i) => (
                    <div key={i} className="bg-slate-800 p-3 rounded">
                      <span className="text-blue-400">{item.name}</span>
                      <span className="text-slate-400 ml-3">// {item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3">Páginas Principales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: '/login', desc: 'Autenticación' },
                    { name: '/dashboard', desc: 'Panel principal' },
                    { name: '/bots', desc: 'Lista de bots' },
                    { name: '/bots/:id/config', desc: 'Configuración de bot' },
                    { name: '/flows', desc: 'Editor de flujos' },
                    { name: '/conversations', desc: 'Monitor de chats' },
                    { name: '/analytics', desc: 'Métricas y reportes' },
                    { name: '/settings', desc: 'Configuración empresa' }
                  ].map((page, i) => (
                    <div key={i} className="bg-slate-800 p-3 rounded">
                      <code className="text-green-400">{page.name}</code>
                      <p className="text-slate-400 text-sm mt-1">{page.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3">Tecnologías Frontend</h3>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'Vite', 'TailwindCSS', 'React Router', 'Zustand', 'Axios', 'Socket.io-client', 'React Query', 'React Hook Form', 'Recharts'].map(tech => (
                    <span key={tech} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Server className="text-green-400" size={32} />
              <h2 className="text-2xl font-bold text-white">Estructura del Backend</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <GitBranch size={20} />
                  Estructura de Carpetas
                </h3>
                <div className="space-y-2 font-mono text-sm">
                  {backendStructure.folders[0].items.map((item, i) => (
                    <div key={i} className="bg-slate-800 p-3 rounded">
                      <span className="text-green-400">{item.name}</span>
                      <span className="text-slate-400 ml-3">// {item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3">Endpoints Principales</h3>
                <div className="space-y-2 font-mono text-sm">
                  {[
                    { method: 'POST', path: '/api/auth/login', desc: 'Iniciar sesión' },
                    { method: 'POST', path: '/api/auth/register', desc: 'Registro empresa' },
                    { method: 'GET', path: '/api/bots', desc: 'Listar bots' },
                    { method: 'POST', path: '/api/bots', desc: 'Crear bot' },
                    { method: 'GET', path: '/api/bots/:id/qr', desc: 'Obtener QR' },
                    { method: 'PUT', path: '/api/bots/:id/status', desc: 'Cambiar estado' },
                    { method: 'GET', path: '/api/flows', desc: 'Listar flujos' },
                    { method: 'POST', path: '/api/flows', desc: 'Crear flujo' },
                    { method: 'GET', path: '/api/conversations', desc: 'Listar conversaciones' },
                    { method: 'POST', path: '/api/messages/send', desc: 'Enviar mensaje' }
                  ].map((endpoint, i) => (
                    <div key={i} className="bg-slate-800 p-3 rounded flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        endpoint.method === 'GET' ? 'bg-blue-600' :
                        endpoint.method === 'POST' ? 'bg-green-600' :
                        'bg-yellow-600'
                      } text-white`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1">
                        <code className="text-yellow-400">{endpoint.path}</code>
                        <p className="text-slate-400 text-xs mt-1">{endpoint.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-bold mb-3">Tecnologías Backend</h3>
                <div className="flex flex-wrap gap-2">
                  {['Node.js', 'Express', 'MongoDB', 'Mongoose', 'whatsapp-web.js', 'Socket.io', 'JWT', 'Bcrypt', 'Bull', 'Redis', 'Multer', 'Joi'].map(tech => (
                    <span key={tech} className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-purple-400" size={32} />
              <h2 className="text-2xl font-bold text-white">Modelos de Base de Datos</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataModels.map((model, idx) => (
                <div key={idx} className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Database size={18} className="text-purple-400" />
                    {model.name}
                  </h3>
                  <div className="space-y-1 font-mono text-sm">
                    {model.fields.map((field, i) => (
                      <div key={i} className="text-slate-300">
                        <span className="text-purple-400">•</span> {field}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-slate-700 p-4 rounded-lg">
              <h3 className="text-white font-bold mb-3">Consideraciones Multi-Tenant</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <Shield className="text-yellow-400 mt-1" size={16} />
                  <span>Cada documento incluye <code className="text-yellow-400">companyId</code> para aislamiento</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="text-yellow-400 mt-1" size={16} />
                  <span>Middleware verifica permisos en cada request</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="text-yellow-400 mt-1" size={16} />
                  <span>Índices compuestos para optimizar queries multi-tenant</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="text-yellow-400 mt-1" size={16} />
                  <span>Sesiones de WhatsApp aisladas por empresa</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <MessageSquare />
            Flujo de Funcionamiento
          </h3>
          <ol className="space-y-2 text-sm">
            <li><strong>1.</strong> Empresa se registra y crea cuenta</li>
            <li><strong>2.</strong> Crea un bot y escanea código QR</li>
            <li><strong>3.</strong> Backend crea instancia de whatsapp-web.js</li>
            <li><strong>4.</strong> Configura flujos conversacionales</li>
            <li><strong>5.</strong> Cuando llega mensaje, Flow Engine procesa y responde</li>
            <li><strong>6.</strong> Frontend recibe actualizaciones vía WebSocket</li>
            <li><strong>7.</strong> Se guardan métricas y conversaciones en MongoDB</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDiagram;