import { motion } from 'framer-motion'

function Logo() {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        className="w-10 h-10 mr-3 rounded-lg object-contain bg-white/0"
        loading="eager"
        decoding="async"
      />
      <span className="text-xl font-semibold text-white">Digital<span className="text-primary">Sign</span></span>
    </motion.div>
  )
}

export default Logo