const API = import.meta.env.VITE_API_BASE as string;
export function getToken(){ return localStorage.getItem('jwt'); }
async function http(path: string, init: RequestInit = {}){
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(init.headers||{}) };
  const token = getToken(); if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export const api = {
  login(email:string,password:string){return http('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});},
  providers(params:Record<string,string>){const q=new URLSearchParams(params).toString(); return http(`/api/providers?${q}`);},
  availability(params:Record<string,string>){const q=new URLSearchParams(params).toString(); return http(`/api/availability?${q}`);},
  createAppointment(payload:any){return http('/api/appointments',{method:'POST',body:JSON.stringify(payload)});},
  cancelAppointment(id:string,reason?:string){return http(`/api/appointments/${id}/cancel`,{method:'POST',body:JSON.stringify({reason})});}
};
