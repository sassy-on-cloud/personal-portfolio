const legacyRoutes = {
  about: '/', skills: '/resume/', projects: '/projects/',
  journey: '/journey/', lab: '/notes/', contact: '/contact/',
};
const fragment = location.hash.slice(1);
if (legacyRoutes[fragment]) location.replace(legacyRoutes[fragment]);
