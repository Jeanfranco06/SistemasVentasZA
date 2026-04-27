const baseUrl = 'http://localhost:4000/api/v1';

async function main() {
  const loginResp = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@stockflow.test',
      password: 'Admin123456!',
    }),
  });

  const loginJson = await loginResp.json();

  if (!loginResp.ok) {
    console.error('LOGIN_ERROR');
    console.error(JSON.stringify(loginJson, null, 2));
    process.exit(1);
  }

  const token = loginJson?.data?.accessToken;
  if (!token) {
    console.error('NO_TOKEN');
    console.error(JSON.stringify(loginJson, null, 2));
    process.exit(1);
  }

  const resumenResp = await fetch(`${baseUrl}/estadisticas/resumen`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const resumenJson = await resumenResp.json();

  console.log(JSON.stringify({
    login: {
      success: loginJson.success,
      roles: loginJson?.data?.usuario?.roles,
    },
    resumenStatus: resumenResp.status,
    resumen: resumenJson,
  }, null, 2));
}

main().catch((error) => {
  console.error('SCRIPT_ERROR');
  console.error(error);
  process.exit(1);
});
