import passport from 'passport';
import PassportJwt from 'passport-jwt';
import DB from '../models/db.js';

export default function () {
  const JwtStrategy = PassportJwt.Strategy;
  const ExtractJwt = PassportJwt.ExtractJwt;

  const opts: any = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = process.env.AUTH_API_TOKEN_SECRET;
  opts.algorithms = ['HS256'];

  passport.use(new JwtStrategy(opts, async (jwt_payload: any, done: any) => {
    try {
      let userId = jwt_payload.sub;
      let jti = jwt_payload.jti;

      if (!userId) {
        return done(null, null);
      }

      if (jti) {
        const isBlacklisted = await (DB as any).TokenBlacklist.isBlacklisted(jti);
        if (isBlacklisted) {
          return done(null, false, { message: 'Token revoked' });
        }
      }

      let user = await (DB as any).Users.findOne({
        where: {
          id: userId,
          account_status: 'Active'
        },
        raw: true
      });

      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  }));
}