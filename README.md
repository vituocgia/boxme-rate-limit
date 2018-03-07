# boxme-rate-limiter
Nodejs middleware that manages rate limiting &amp; request throttling. Uses the token bucket algorithm.

## Usage

Creating a new limit returns a function handler that can easily be plugged into Restify and other frameworks that support the common `(req, res, next)` middleware signature  format.

Limits can be instance-specific or shared across multiple servers. See *name* and *local* options.

````javascript
limiter = require('boxme-rate-limiter');

limiter.setup({
  redis: 'redis://localhost:6379',
  appName: 'your-app',
  verbose: true
});

var limit = limiter.createLimit({
  key: (x) => {return 'global'},
  rate: '50/s'
})

server.use(limit)
````

## How

Uses the token bucket algorithm. For each key (request grouping), a bucket is created with full capacity. Each accepted request decrements the amount of tokens in the bucket. When the bucket is empty, requests are rejected.

The bucket is replenished by a fractional amount with each rejected request, function of the time elapsed since last update.


## API

### Methods

**setup(options)**  
Creates a redis client and connects using provided connection string.  
Options:

Name    | Type    | Mandatory | Description
--------|---------|-----------|-------------
redis   | String  | no        | redis connection string. Mandatory if using shared buckets.
appName | String  | no        | An identifier for the app using the module. Defaults: ""
logger  | Object  | no        | logger object. Must expose debug/info/error methods. Default: console.
verbose | Boolean | no        | Default: false
sns     | Object  | no        | SNS configuration

To send SNS notifications upon throttling activated/lifted, the *sns* object must have the following properties:
- **service**: an SNS service object that exposes a *publish(arn, subject, message)* method
- **arn**: ARN of the topic to use

*NB*: Not specifying an appName will cause issues if multiple applications have limits with the same name and share the same redis server.

**createLimit(options)**  
Creates a new rate limit. See [Options](#limit-options) for details.



## Limit Options

**key**  
Type: function  
Mandatory: true  
Returns the value for request grouping (e.g. IP, endpoint). The provided argument is the request object.  
Return a constant for a global limit that applies to all requests.

**rate**  
Type: string  
Mandatory: true  
The rate to apply. Must be in the form **number of requests** *slash* **time window**.  Time window can be a single unit, or a number and a unit for more complex rules.  
Accepted time units: 's' (second), 'm' (minute), 'h' (hour), 'd' (day).

Examples:  
100/s: 100 requests per second  
300/5min: 300 request every 5 minutes

**name**  
Type: string  
Mandatory: no (default: random string)  
Limit identifier. If multiple limits share the same name, there will be a single bucket for them. So, limits that must apply cross-instances must have an explicit name, otherwise the random names will not match across instances.  
On the other hand, instance-specific limits (e.g. max requests per server) must have a random name or set **local** to true.

**local**  
Type: Boolean  
Mandatory: no (default: false)  
Whether to use a local or remote bucket. A local bucket is stored in-memory, and is not shared across instances. A remote bucket uses Redis as a backend store and can be shared.

**logger**  
Type: object  
Mandatory: no (default: none)  
Overwrites the global logger for this limit only.

**verbose**  
Type: boolean  
Mandatory: no (default: false)  
Enable/disable verbose logging. Overwrites the global setting.
