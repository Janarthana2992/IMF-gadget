const generateCodename = () => {
    const prefixes = ['The', 'Project', 'Operation', 'Agent', 'Device'];
    const nouns = [
      'Nightingale', 'Shadow', 'Phoenix', 'Kraken', 'Ghost', 
      'Falcon', 'Mirage', 'Specter', 'Eclipse', 'Viper',
      'Phantom', 'Raven', 'Chimera', 'Dragon', 'Sentinel'
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${prefix} ${noun}`;
  };
  
  const generateMissionSuccessProbability = () => {
    return Math.floor(Math.random() * 71) + 30; // Random number between 30% and 100%
  };
  
  const generateSelfDestructCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };
  
  module.exports = {
    generateCodename,
    generateMissionSuccessProbability,
    generateSelfDestructCode
  };