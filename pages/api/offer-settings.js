import fs from 'fs';
import path from 'path';

// Caminho para o arquivo de configurações
const configPath = path.join(process.cwd(), 'data', 'offer-settings.json');

// Garantir que o diretório data existe
const ensureDirectoryExists = () => {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Carregar configurações existentes
const loadSettings = () => {
  try {
    ensureDirectoryExists();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
  
  // Configurações padrão
  return { 
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h a partir de agora
  };
};

// Salvar configurações
const saveSettings = (settings) => {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return false;
  }
};

export default async function handler(req, res) {
  // Somente administradores autorizados devem acessar esta API em produção
  // Aqui você adicionaria verificação de autenticação/autorização
  
  if (req.method === 'GET') {
    const settings = loadSettings();
    res.status(200).json(settings);
  } else if (req.method === 'POST') {
    const { endDate } = req.body;
    
    if (!endDate) {
      return res.status(400).json({ error: 'Data de expiração é obrigatória' });
    }
    
    const settings = { endDate };
    
    if (saveSettings(settings)) {
      res.status(200).json({ message: 'Configurações salvas com sucesso', settings });
    } else {
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
