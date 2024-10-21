import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Info, Brain, Lock, Zap } from 'lucide-react';
import { initializeModel, predictStrength } from './passwordModel';
import debounce from 'lodash.debounce';

// Constants for character types
const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;
const DIGITS = /\d/;
const SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const App: React.FC = () => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [entropy, setEntropy] = useState(0);
  const [mlScore, setMlScore] = useState(0);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState('');
  const [isModelReady, setIsModelReady] = useState(false);
  const [mlExplanation, setMlExplanation] = useState<string[]>([]);

  useEffect(() => {
    const loadModel = async () => {
      await initializeModel();
      setIsModelReady(true);
    };
    loadModel();
  }, []);

  const analyzePassword = useCallback(async (pwd: string) => {
    const newAnalysis: string[] = [];
    const newMlExplanation: string[] = [];

    // Calculate entropy
    const charset = 95; // Printable ASCII characters
    const calculatedEntropy = pwd.length * Math.log2(charset);
    setEntropy(calculatedEntropy);

    // ML-based strength prediction
    const hasLower = LOWERCASE.test(pwd);
    const hasUpper = UPPERCASE.test(pwd);
    const hasDigit = DIGITS.test(pwd);
    const hasSpecial = SPECIAL.test(pwd);
    
    if (isModelReady) {
      const predictedScore = await predictStrength(pwd.length, hasLower, hasUpper, hasDigit, hasSpecial);
      const normalizedScore = Math.round(predictedScore * 100);
      setMlScore(normalizedScore);

      // Adaptive feedback based on ML score
      if (normalizedScore < 30) {
        setAdaptiveFeedback("Your password is very weak. Try adding more variety and length.");
      } else if (normalizedScore < 60) {
        setAdaptiveFeedback("Your password could be stronger. Consider using a mix of character types.");
      } else if (normalizedScore < 80) {
        setAdaptiveFeedback("Good password! For even better security, try increasing its complexity.");
      } else {
        setAdaptiveFeedback("Excellent password! It would be very difficult to crack.");
      }

      setStrength(Math.min(Math.floor(normalizedScore / 25), 4));

      // ML Explanation
      newMlExplanation.push(`Length (${pwd.length}): ${pwd.length < 8 ? 'Too short' : pwd.length < 12 ? 'Acceptable' : 'Good'}`);
      newMlExplanation.push(`Lowercase: ${hasLower ? 'Present' : 'Missing'}`);
      newMlExplanation.push(`Uppercase: ${hasUpper ? 'Present' : 'Missing'}`);
      newMlExplanation.push(`Digits: ${hasDigit ? 'Present' : 'Missing'}`);
      newMlExplanation.push(`Special chars: ${hasSpecial ? 'Present' : 'Missing'}`);
    }

    // Character type analysis
    if (!hasLower) newAnalysis.push("Add lowercase letters");
    if (!hasUpper) newAnalysis.push("Add uppercase letters");
    if (!hasDigit) newAnalysis.push("Add numbers");
    if (!hasSpecial) newAnalysis.push("Add special characters");

    // Length analysis (adjusted for typical usernames)
    if (pwd.length < 8) newAnalysis.push("Password is too short (aim for at least 12 characters)");
    if (pwd.length > 64) newAnalysis.push("Password is excessively long");

    // Common patterns check
    if (/(.)\1{2,}/.test(pwd)) newAnalysis.push("Avoid repeated characters");
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890)/i.test(pwd)) {
      newAnalysis.push("Avoid sequential characters");
    }

    setAnalysis(newAnalysis);
    setMlExplanation(newMlExplanation);
  }, [isModelReady]);

  const debouncedAnalyzePassword = useCallback(
    debounce((pwd: string) => analyzePassword(pwd), 300),
    [analyzePassword]
  );

  useEffect(() => {
    if (password) {
      debouncedAnalyzePassword(password);
    } else {
      setStrength(0);
      setAnalysis([]);
      setEntropy(0);
      setMlScore(0);
      setAdaptiveFeedback('');
      setMlExplanation([]);
    }
  }, [password, debouncedAnalyzePassword]);

  const getStrengthColor = () => {
    const colors = ['red', 'orange', 'yellow', 'lime', 'green'];
    return colors[strength];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4 py-8">
      <div className="bg-white bg-opacity-10 p-8 rounded-2xl shadow-2xl backdrop-blur-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center">
          <Lock className="mr-2 text-blue-400" size={32} />
          ML Password Strength
        </h1>
        
        <div className="relative mb-6">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter your password"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-white font-semibold">Strength:</span>
            <span className="text-white">{['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'][strength]}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out bg-${getStrengthColor()}-500`}
              style={{ width: `${(strength + 1) * 20}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-4">
          <h2 className="text-white font-semibold mb-2 flex items-center">
            <Brain className="mr-2 text-purple-400" size={20} />
            AI Analysis
            <div className="relative inline-block ml-2 group">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 w-64 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                Our AI model analyzes your password based on length, character types, and common patterns. It learns from a dataset of passwords to provide a more nuanced strength assessment.
              </div>
            </div>
          </h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">ML Strength Score:</span>
            <span className="text-sm text-white font-semibold">{mlScore}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${mlScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-purple-400 italic mb-2">{adaptiveFeedback}</p>
          <div className="text-sm text-gray-300">
            <h3 className="font-semibold text-white mb-1">AI Insights:</h3>
            <ul className="space-y-1">
              {mlExplanation.map((insight, index) => (
                <li key={index} className="flex items-center">
                  <Zap size={12} className="text-yellow-400 mr-1" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-4">
          <h2 className="text-white font-semibold mb-2">Advanced Analysis</h2>
          <ul className="text-sm text-gray-300 space-y-1">
            <li className="text-blue-400 flex items-center">
              Entropy: {entropy.toFixed(2)} bits
              <div className="relative inline-block ml-2 group">
                <Info size={16} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 w-64 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Entropy measures the randomness and unpredictability of your password. Higher entropy (more bits) means a stronger password. Aim for at least 60 bits for good security.
                </div>
              </div>
            </li>
            {analysis.map((item, index) => (
              <li key={index} className="text-yellow-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;