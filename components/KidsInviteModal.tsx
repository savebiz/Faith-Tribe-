import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface KidsInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KidsInviteModal: React.FC<KidsInviteModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = '/images/kids_invite_bg.png';
      img.onload = () => {
        // Draw the background image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Add fun text overlaid on the image
        ctx.textAlign = 'center';
        
        // Title
        ctx.font = 'bold 50px "Comic Sans MS", "Chalkboard SE", sans-serif';
        ctx.fillStyle = '#D97706'; // Amber 600
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillText("YOU'RE INVITED!", canvas.width / 2, 120);

        // Subtitle
        ctx.font = 'bold 32px "Comic Sans MS", "Chalkboard SE", sans-serif';
        ctx.fillStyle = '#0D9488'; // Teal 600
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText("Join me at Faith Tribe Kids!", canvas.width / 2, 180);

        // Body text
        ctx.font = '24px "Comic Sans MS", "Chalkboard SE", sans-serif';
        ctx.fillStyle = '#374151'; // Gray 700
        ctx.fillText("We learn about Jesus, play games,", canvas.width / 2, 240);
        ctx.fillText("and have the best time together!", canvas.width / 2, 280);

        // Footer
        ctx.font = 'bold 28px "Comic Sans MS", "Chalkboard SE", sans-serif';
        ctx.fillStyle = '#E11D48'; // Rose 600
        ctx.fillText("Can't wait to see you there! 🌟", canvas.width / 2, 360);

        setIsImageReady(true);
      };
      img.onerror = () => {
         // fallback if image fails to load
         ctx.fillStyle = '#fef3c7'; // amber-50
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.font = 'bold 40px sans-serif';
         ctx.fillStyle = '#D97706';
         ctx.textAlign = 'center';
         ctx.fillText("YOU'RE INVITED TO", canvas.width / 2, 150);
         ctx.fillText("FAITH TRIBE KIDS!", canvas.width / 2, 220);
         setIsImageReady(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current || !isImageReady) return;
    
    const link = document.createElement('a');
    link.download = 'faith-tribe-kids-invite.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Invite Card downloaded!');
  };

  const handleShare = async () => {
    if (!canvasRef.current || !isImageReady) return;
    
    try {
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, 'image/png'));
      if (blob && navigator.share) {
        const file = new File([blob], 'faith-tribe-kids-invite.png', { type: 'image/png' });
        await navigator.share({
          title: 'Join me at Faith Tribe Kids!',
          text: "I'd love for you to join me at Faith Tribe Kids! Check out this invite card.",
          files: [file]
        });
      } else {
        toast.error('Sharing not supported on this browser. Try downloading instead!');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border-4 border-amber-200 relative">
        
        {/* Header */}
        <div className="bg-amber-100 px-6 py-4 flex items-center justify-between border-b border-amber-200">
          <h3 className="text-xl font-black text-amber-700 font-display flex items-center gap-2">
            <span className="text-2xl">✨</span> Your Invite Card!
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-amber-200/50 text-amber-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-amber-50/30 flex flex-col items-center">
          
          <p className="text-center text-gray-600 font-medium mb-6">
            Here is your custom invite card! Download it or share it directly with your friends.
          </p>

          <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-amber-100 bg-white relative w-full max-w-[600px] aspect-[3/2]">
            {!isImageReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            )}
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={400} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={handleDownload}
              disabled={!isImageReady}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-400 text-white font-black rounded-2xl hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Download size={20} />
              Download Card
            </button>
            <button
              onClick={handleShare}
              disabled={!isImageReady}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-teal-500 text-teal-600 font-black rounded-2xl hover:bg-teal-50 transition-all hover:scale-105 active:scale-95 shadow-md shadow-teal-100 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Share2 size={20} />
              Share with Friend
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
