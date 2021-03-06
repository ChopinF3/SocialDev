const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('config')
const { check, validationResult } = require('express-validator')

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server error')
  }
})

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    console.log(req.body)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body
    try {
      //see if the user exist
      let user = await User.findOne({ email })
      if (!user) {
        return res.status(400).json({ error: [{ msg: 'Invalid Credentials' }] })
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(400).json({ error: [{ msg: 'Invalid Credentials' }] })
      }

      //return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      }
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )
    } catch (err) {
      console.log(err.message)
      res.status(500).send('server error')
    }
  }
)

module.exports = router
