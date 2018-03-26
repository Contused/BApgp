% simple Kalman Filter example:
% state "x" consists of position and velocity
% system model "F" is a cinematic model of constant velocity
% only the position is measured

clear			% clear all matlab variables

%%% declare matlab variables and asign default (randomly chosen) value
% simulation specifications
T = 1;							% make a measurement every T steps. also called \Delta t
										% i.e. every 1, 2, 3, ... seconds
real_x = [0; 10];		% "real world" state, only needed in simulation context
										% also called ground truth. start: position=0, velocity=10

% model specifications
model_F = [1, T ; 	% the model we have about the real world
					 0, 1];		% here: cinematic model of constant velocity
q = 9;							% controls the amount of process noise. is usually unknown
model_Q = [T^4/4, T^3/2;			% process noise
					 T^3/2, T^2 ]*q;		% arises from the cinematic model

% estimations specifications
esti_x = [0; 10];		% estimated state: position and velocity
esti_P = [1, 0 ;		% estimated covariance of esti_x. refelcts
					0, 2];		% the uncertainty about the estimated state esti_x
				
esti_z = 0;			% estimated measured value. here: just depicting position-entry
								% of esti_x since we are only iterested in the position. Or
								% maybe it is only possible to measure position, but not velocity
esti_S = [0,0 ; % estimated covariance of esti_z. Will consist of process noise
					0,0]; % with added measurement noise
				
H = [1, 0;			% observation matrix. we only measure position values
		 0, 0];			% this row could be left out, but then also modify R to 1x1
R = [1, 0 ;			% measurement noise. is usually unknown. reflects the
		 0, 1];			% inaccuracy of the sensors
K = [0, 0];			% Kalman gain vector


%%% Initialization
esti_x = [0; 10];
esti_P = [1, 0 ;
					0, 2];

for step = 1:1000					% simulate for 1000 steps (simulate continuous time)
	if mod(step, T) == 0		% if it is time to take a new measurement
		% update the "real data". For simplicity: take the model F. But could be any
		% other function, possibly non-linear. 
		% mvnrnd = multi variate normal random numbers
		real_x = model_F * real_x + transpose(mvnrnd([0,0], model_Q));
		
		%%% Step 1: Prediction Step
		esti_x = model_F * esti_x;	% estimate the new state according to the 
																% system model since we do not have any 
																% control inputs, this term is left out
		esti_P = model_F * esti_P * transpose(model_F) + model_Q;  % update the 
																% covariance of estimated state esti_x
		esti_z = H * esti_x;				% depic position value from estimated state
		esti_S = H * esti_P * transpose(H) + R;  % estimation of the covariance of 
																% the estimated measured value. inherits model
																% noise and measurement noise
		
		%%% make a measurement z
		z = H * real_x + transpose(mvnrnd([0,0], R));	% make a noisy measurement
		
		% Step 2: Innovation Step
		K = esti_P * transpose(H) * esti_S^-1;	% calculate Kalman gain vector by
																						% comparing model and measurement
																						% noise
		esti_x = esti_x + K * (z - esti_z);			% update the estimated state by an
																						% weighted sum of the measurement 
																						% and the model-estimation
		esti_P = esti_P - K * esti_S * transpose(K);	% update covariance of 
																									% estimated state
	end
end
