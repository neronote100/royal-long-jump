export function validateRecord(body) {
 const name = typeof body?.name === 'string' ? body.name.normalize('NFKC').trim() : '';
 if (!name || [...name].length > 20 || /[\p{Cc}\p{Cf}]/u.test(name)) throw new Error('名前は1〜20文字で入力してください。');
 if (!Number.isSafeInteger(body.distance_cm) || body.distance_cm < 1 || body.distance_cm > 100000) throw new Error('記録が範囲外です。');
 return {name, distance_cm:body.distance_cm};
}
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function onRequest({request,env}) {
 if (!env.DB) return json({error:'ランキングは公開準備中です。'},503);
 try {
  if (request.method === 'GET') {
   const name = new URL(request.url).searchParams.get('name');
   if(name) return json({history:(await env.DB.prepare('SELECT previous_cm, distance_cm, updated_at FROM history WHERE name = ? ORDER BY id DESC LIMIT 100').bind(name.normalize('NFKC').trim()).all()).results});
   return json({ranking:(await env.DB.prepare('SELECT name, distance_cm, updated_at FROM players ORDER BY distance_cm DESC, updated_at ASC, name ASC LIMIT 30').all()).results});
  }
  if(request.method !== 'POST') return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin') && request.headers.get('Origin') !== new URL(request.url).origin) return json({error:'送信元が一致しません。'},403);
  if(Number(request.headers.get('Content-Length')) > 1024) return json({error:'送信内容が大きすぎます。'},413);
  const raw = await request.text();
  if(raw.length > 1024) return json({error:'送信内容が大きすぎます。'},413);
  const {name,distance_cm} = validateRecord(JSON.parse(raw));
  const result = await env.DB.prepare("INSERT INTO players(name,distance_cm,updated_at) VALUES(?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(name) DO UPDATE SET distance_cm=excluded.distance_cm, updated_at=excluded.updated_at WHERE excluded.distance_cm > players.distance_cm RETURNING name,distance_cm,updated_at").bind(name,distance_cm).first();
  const record = result || await env.DB.prepare('SELECT name,distance_cm,updated_at FROM players WHERE name=?').bind(name).first();
  return json({improved:!!result,record});
 } catch(error) {
  if(error instanceof SyntaxError || /名前|記録/.test(error.message)) return json({error:error.message},400);
  return json({error:'ランキングの処理に失敗しました。もう一度お試しください。'},500);
 }
}
