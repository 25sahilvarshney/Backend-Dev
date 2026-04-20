const helmet = require('helmet');

class HelmetConfig {
  static configure() {
    return helmet({
      // Content Security Policy for e-commerce platform
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for some payment gateways
            'https://www.youtube.com',
            'https://s.ytimg.com',
            'https://js.stripe.com',
            'https://www.paypal.com',
            process.env.CDN_URL
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            process.env.CDN_URL
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https:',
            process.env.CDN_URL,
            'https://img.youtube.com'
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            process.env.CDN_URL
          ],
          connectSrc: [
            "'self'",
            process.env.PAYMENT_GATEWAY_URL,
            'https://api.stripe.com',
            'https://www.paypal.com'
          ],
          frameSrc: [
            "'self'",
            'https://www.youtube.com',
            'https://js.stripe.com',
            'https://www.paypal.com'
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", process.env.CDN_URL],
          frameAncestors: ["'none'"],
          formAction: [
            "'self'",
            process.env.PAYMENT_GATEWAY_URL
          ],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
      },
      
      // HSTS (HTTP Strict Transport Security)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      
      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },
      
      // XSS Protection (legacy browser support)
      xssFilter: true,
      
      // No Sniff (prevent MIME type sniffing)
      noSniff: true,
      
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },
      
      // Permissions Policy
      permissionsPolicy: {
        features: {
          payment: ["'self'", process.env.PAYMENT_GATEWAY_URL],
          camera: ["'none'"],
          microphone: ["'none'"],
          geolocation: ["'none'"],
          fullscreen: ["'self'"]
        }
      },
      
      // Cross-Origin-Embedder-Policy
      crossOriginEmbedderPolicy: false, // Required for some CDN resources
      
      // Cross-Origin-Opener-Policy
      crossOriginOpenerPolicy: {
        policy: 'same-origin'
      }
    });
  }
}

module.exports = HelmetConfig;