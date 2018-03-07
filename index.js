'use strict'
/**
 * Limit access to middleware for the same ip
 * @param {object} options Configuration parameters 
 * @param {number} options.max Maximum number of visits to the same ip per cycle
 * @param {number} options.duration The duration of each cycle, in milliseconds
 * @param {object} options.cache Cache, can use redis instance, use memory cache by default
 */

const MemoryCache = require('./lib/memory-cache')
const getIp = require('./lib/get-ip')

const prefix = 'rate_limit_ip_'

class RateLimit {
  constructor (options) {
    const config = Object.assign({
      max: 10, // Maximum number of visits to the same ip per cycle
      duration: 1000, // The duration of each cycle, in milliseconds
      cache: new MemoryCache() // Caching
    }, options)

    return function(req, res, next) {
      const ip = getIp(req)
      const key = prefix+ip

      config.cache.get(key).then(current => {
        if(!current) {
          // Period has not been visited
          config.cache.set(key, 1, 'EX', config.duration / 1000)
          next()
          return
        }

        // Increase the current counter
        current = +current

        if(current >= config.max) {
          // Limit exceeded
          console.info('User (ip: ${ip}) accesses ${req.path} over access frequency limit')
          next('Maximum access frequency limit has reached')
          return
        }

        // Visits plus 1
        config.cache.incr(key)
        next()
      }).catch(err => {
        console.error(err.message || err)
        next()
      })
    }
  }
}

module.exports = RateLimit
