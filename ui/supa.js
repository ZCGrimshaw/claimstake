/* Online backend for the web build: a tiny Firestore-shaped adapter over Supabase REST (anonymous sign-in + polling). */
window.ClaimSupa = function (cfg) {
  const U = cfg.url, K = cfg.key, SK = 'claimstake.sb';
  let sess = null;
  try { sess = JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { sess = null; }
  const save = () => { try { localStorage.setItem(SK, JSON.stringify(sess)); } catch (e) { /* ignore */ } };
  async function auth() {
    const now = Date.now() / 1000;
    if (sess && sess.expires_at - 60 > now) return sess;
    if (sess && sess.refresh_token) {
      const r = await fetch(U + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: sess.refresh_token }) });
      if (r.ok) { sess = await r.json(); save(); return sess; }
    }
    const r = await fetch(U + '/auth/v1/signup', { method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: {} }) });
    if (!r.ok) throw new Error('signin');
    sess = await r.json(); save(); return sess;
  }
  async function rest(path, opt) {
    const s = await auth();
    const r = await fetch(U + '/rest/v1/claim_docs' + path, Object.assign({}, opt, { headers: Object.assign({ apikey: K, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }, (opt && opt.headers) || {}) }));
    if (!r.ok) { let m = ''; try { m = (await r.json()).message || ''; } catch (x) { /* ignore */ } const e = new Error(m || 'http ' + r.status); e.code = r.status + (m ? ' ' + m.slice(0, 60) : ''); e.status = r.status; throw e; }
    const t = await r.text(); return t ? JSON.parse(t) : null;
  }
  const snapOf = row => ({ id: row.path.split('/')[1], exists: true, data: () => row.data });
  const MISSING = { exists: false, data: () => undefined };
  function poll(fetcher, cb, err, ms) {
    let stop = false, last = null, timer = null;
    const tick = async () => {
      if (stop) return;
      try {
        if (!document.hidden || last === null) {
          const out = await fetcher(), sig = JSON.stringify(out.sig);
          if (!stop && sig !== last) { last = sig; cb(out.snap); }
        }
      } catch (e) { if (!stop && e.status === 401) { sess = null; } else if (!stop && e.code && e.code !== 'net') err && err(e); }
      if (!stop) timer = setTimeout(tick, document.hidden ? 5000 : ms);
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }
  const db = {
    doc(p) {
      const q = '?path=eq.' + encodeURIComponent(p);
      const get = async () => { const rows = await rest(q + '&select=path,data,updated_at'); return rows.length ? snapOf(rows[0]) : MISSING; };
      return {
        get,
        async set(data) {
          const hd = { Prefer: 'return=representation' };
          const upd = await rest(q, { method: 'PATCH', headers: hd, body: JSON.stringify({ data }) });
          if (upd && upd.length) return;
          await rest('', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ path: p, data }) });
        },
        onSnapshot(cb, err) {
          return (function () {
            let stop = false, lastSig = null, timer = null;
            const tick = async () => {
              if (stop) return;
              try {
                if (!document.hidden || lastSig === null) {
                  const rows = await rest(q + '&select=updated_at');
                  const sig = rows.length ? rows[0].updated_at : 'none';
                  if (sig !== lastSig) { const s = await get(); lastSig = sig; if (!stop) cb(s); }
                }
              } catch (e) { if (e.status === 401) sess = null; else if (!stop && e.code) err && err(e); }
              if (!stop) timer = setTimeout(tick, document.hidden ? 5000 : 1200);
            };
            tick();
            return () => { stop = true; clearTimeout(timer); };
          })();
        }
      };
    },
    collection(name) {
      return {
        where(field, op, val) {
          const f = '&path=like.' + name + '/*&data-%3E%3E' + encodeURIComponent(field) + '=eq.' + encodeURIComponent(val) + '&select=path,data,updated_at';
          const run = async () => (await rest('?' + f.slice(1))).map(snapOf);
          return {
            async get() { const docs = await run(); return { docs, empty: !docs.length }; },
            onSnapshot(cb, err) {
              return poll(async () => {
                const rows = await rest('?' + f.slice(1));
                return { sig: rows.map(r => r.path + r.updated_at), snap: { docs: rows.map(snapOf), empty: !rows.length } };
              }, cb, err, 1200);
            }
          };
        }
      };
    }
  };
  return {
    db,
    user: { id: async () => (await auth()).user.id }
  };
};
