/**
 * Endpoint para realizar logout do usuário
 * Remove os cookies de autenticação JWT e de sessão
 * Implementação à prova de falhas que não depende da biblioteca cookie
 */
export default async function handler(req, res) {
  // Aceitar requisições GET também para permitir logout via URL direta
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    console.log("[API:logout] Requisição de logout recebida");
    
    // ABORDAGEM SIMPLIFICADA: não depender da biblioteca cookie
    // Limpar cookies diretamente com cabeçalhos HTTP    // Lista de cookies comuns para autenticação
    const cookiesToClear = [
      // Auth cookies
      "auth_token",
      "auth_token_client",
      "refresh_token",
      "woocommerce-session",
      "woocommerce_session",
      "woo-session",
      "wp-settings",
      "wp-settings-time",
      "wordpress_logged_in",
      "wp_session"
    ];
    
    // Gerar cabeçalhos de cookie para expirar cada um
    const cookieHeaders = [];
    
    // Criar cabeçalhos para cada cookie, com várias configurações de path
    cookiesToClear.forEach(name => {
      // Expirar pela raiz
      cookieHeaders.push(`${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly`);
      // Expirar para /api também
      cookieHeaders.push(`${name}=; Path=/api; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly`);
      // Versão não-HttpOnly
      cookieHeaders.push(`${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT`);
    });
    
    // Adicionar todos os cabeçalhos de cookie
    res.setHeader("Set-Cookie", cookieHeaders);
    
    // Cabeçalhos para evitar cache
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    console.log("[API:logout] Cookies removidos com sucesso:", cookieHeaders.length);
    return res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso",
      clearedCookies: cookieHeaders.length
    });
  } catch (error) {
    console.error("[API:logout] Erro ao fazer logout:", error);
    
    // Mesmo em caso de erro, tenta limpar alguns cookies principais
    try {      res.setHeader("Set-Cookie", [
        "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly",
        "auth_token_client=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;",
        "refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly",
        "woocommerce-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly"
      ]);
    } catch (cookieError) {
      console.error("[API:logout] Erro ao limpar cookies de fallback:", cookieError);
    }
    
    return res.status(500).json({
      success: false,
      message: `Erro interno no servidor: ${error.message}`,
      error: error.toString()
    });
  }
}