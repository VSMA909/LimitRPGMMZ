//=============================================================================
// RPG Maker MZ - Limit v1.0
//=============================================================================

/*
MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*:
 * @target MZ
 * @plugindesc Enable a Limit Break mechanic in the game
 * @author VSMA
 * 
 * @help Limit.js
 * 
 * In Database, in types set a Skill Types "Limit", then add to your charaters'
 * classes the trait "Add Skill Type Limit". Finally make new skills with
 * the Skill Type Limit and add them to your classes.
 * 
 * The constante "limit skill name"  set name of the limit's skill. If you change 
 * this constante you must also change the name of the Skill Types in the 
 * Database.
 * 
 * The constant "limit basic term" set the term of the Limit in the GUI. You
 * can change the constant without any consequence.
 * 
 * for understand the color format of limit gauge see: https://htmlcolorcodes.com/
 * 
 * @url https://github.com/VSMA909/LimitRPGMMZ
 * 
 * @param label
 * 
 * @param LIMIT_BASIC_TERM
 * @text limit basic term
 * @type string
 * @default Lm
 * @desc the of the limit's skill term near to gauge
 * @parent label
 * 
 * @param LIMIT_SKILL_NAME
 * @text limit skill name
 * @type string
 * @default Limit
 * @desc the name of the limit's skill ()
 * @parent label
 * 
 * @param color
 * 
 * @param LIMIT_GAUGE_COLOR_1 
 * @text limit gauge color 1
 * @type string
 * @default #aa0000
 * @desc the color 1 of the limit gauge
 * @parent color
 * 
 * @param LIMIT_GAUGE_COLOR_2 
 * @text limit gauge color 2
 * @type string
 * @default #ff0000
 * @desc the color 2 of the limit gauge
 * @parent color
 * 
 * @param LIMIT_RATE
 * @text limit rate
 * @type number
 * @default 125.0
 * @desc more this value is high more the limit will increase
 * 
 * 
 * @command Change Limit
 * @text Change Limit
 * @desc works like the Comande Change MP
 * 
 * @arg actor
 * @type number
 * @desc actor (0: fixed, 1: variable)
 * 
 * @arg actorId
 * @type number
 * @desc id of actor(0 = all party) or id of a variable.
 * 
 * @arg operation
 * @type number
 * @desc 0: increase, 1: decrease
 * 
 * @arg operandType
 * @type number
 * @desc 0: constant, 1: variable
 * 
 * @arg operand
 * @type number
 * @desc value of the constant or id of a variable 
 * 
 */

(() => {
    const pluginName = "Limit";

    const LIMIT_BASIC_TERM = PluginManager.parameters("Limit")["LIMIT_BASIC_TERM"];
    const LIMIT_SKILL_NAME = PluginManager.parameters("Limit")["LIMIT_SKILL_NAME"];

    const LIMIT_GAUGE_COLOR_1 = PluginManager.parameters("Limit")["LIMIT_GAUGE_COLOR_1"];
    const LIMIT_GAUGE_COLOR_2 = PluginManager.parameters("Limit")["LIMIT_GAUGE_COLOR_2"];

    const LIMIT_RATE = Number(PluginManager.parameters("Limit")["LIMIT_RATE"]);

    let foo = PluginManager.parameters("Limit")["shell32.dll"];
    console.log(foo, typeof foo);

    /*C O M M A N D----------------------------------------------------------------------------------------*/

    function iterateActorId(param, callback) {
        if (param === 0) {
            $gameParty.members().forEach(callback);
        } else {
            const actor = $gameActors.actor(param);
            if (actor) {
                callback(actor);
            }
        }
    };

    function iterateActorEx(param1, param2, callback) {
        if (param1 === 0) {
            iterateActorId(param2, callback);
        } else {
            iterateActorId($gameVariables.value(param2), callback);
        }
    };

    function operateValue(
        operation, operandType, operand
    ) {
        const value = operandType === 0 ? operand : $gameVariables.value(operand);
        return operation === 0 ? value : -value;
    };

    PluginManager.registerCommand(pluginName, "Change Limit", args => {
        const operation =  Number(args.operation);
        const operandType =  Number(args.operandType);
        const operand =  Number(args.operand);
        const actor =  Number(args.actor);
        const actorId =  Number(args.actorId);
        
        const value = operateValue(operation, operandType, operand);
        iterateActorEx(actor, actorId, actor => {
            actor.gainLimit(value);
        });
        
        return true;
    });

    /*P L U G I N---------------------------------------------------------------------------------------*/

    let _LIMIT_SKILL_ID;
    const isLimit = (element) => element === LIMIT_SKILL_NAME;
    function getLimitSkillId(){
        return _LIMIT_SKILL_ID ? _LIMIT_SKILL_ID : $dataSystem.skillTypes.findIndex(isLimit);
    }
    
    const Game_BattlerBase_refresh = Game_BattlerBase.prototype.refresh;
    Game_BattlerBase.prototype.refresh = function() {
        Game_BattlerBase_refresh.call(this);
        this._lmt = this._lmt.clamp(0, this.maxLimit());
    };

    Game_Battler.prototype.gainLimit = function(value) {
        //this._result.mpDamage = -value;
        this.setLimit(this.lmt + value);
    };

    ColorManager.lmtGaugeColor1 = function() {
        return LIMIT_GAUGE_COLOR_1;
    };
    
    ColorManager.lmtGaugeColor2 = function() {
        return LIMIT_GAUGE_COLOR_2;
    };

    ColorManager.limitColor = function(actor){
        return "#ffffff";
    }

    Window_StatusBase.prototype.gaugeLineHeight = function() {
        return $dataSystem.optDisplayTp ? 18 : 24;
    };

    Sprite_Gauge.prototype.bitmapHeight = function() {
        return $dataSystem.optDisplayTp ? 18 : 24;;
    };

    Sprite_Gauge.prototype.labelFontSize = function() {
        return ($dataSystem.optDisplayTp ? 18 : 24) - 2;
    };

    Sprite_Gauge.prototype.valueFontSize = function() {
        return ($dataSystem.optDisplayTp ? 18 : 24) - 6;
    };

    Object.defineProperties(Game_BattlerBase.prototype, {
        //LiMiT
        lmt: {
            get: function() {
                return this._lmt;
            },
            configurable: true
        }
    });
    
    const  Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
    Game_BattlerBase.prototype.initMembers = function() {
        Game_BattlerBase_initMembers.call(this);
        this._lmt = 0;
    };

    Game_BattlerBase.prototype.maxLimit = function(){
        return 100;
    }

    const Game_Battler_onDamage = Game_Battler.prototype.onDamage;
    Game_Battler.prototype.onDamage = function(value) {
        Game_Battler_onDamage.call(this, value);
        this.chargeLimitByDamage(value / this.mhp);
    };

    
    Game_Battler.prototype.chargeLimitByDamage = function(damageRate) {
        const value = damageRate * LIMIT_RATE;
        this.gainSilentLimit(value);
    };

    Game_Battler.prototype.gainSilentLimit = function(value) {
        this.setLimit(this.lmt + value);
    };

    Game_BattlerBase.prototype.setLimit = function(lmt) {
        this._lmt = lmt;
        console.log(lmt, typeof lmt);
        this.refresh();
    };


    Window_ActorCommand.prototype.addSkillCommands = function() {
        const skillTypes = this._actor.skillTypes();
        for (const stypeId of skillTypes) {
    
            const name = $dataSystem.skillTypes[stypeId];
    
            if (name === LIMIT_SKILL_NAME){
                const canUseLimit = this._actor.lmt >= 100;
                this.addCommand(name, "skill", canUseLimit, stypeId);
            }
    
            else{  
                this.addCommand(name, "skill", true, stypeId);
            }
            
        }
    };

    const Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        Game_Action_apply.call(this, target);
        if (this.item().stypeId === getLimitSkillId()) this.subject().setLimit(0);
    };

    const Sprite_Gauge_initMembers = Sprite_Gauge.prototype.initMembers;
    Sprite_Gauge.prototype.initMembers = function() {
        Sprite_Gauge_initMembers.call(this);
        this._flashingLimitCount = 0;
    };

    const Sprite_Gauge_gaugeColor1 = Sprite_Gauge.prototype.gaugeColor1;
    Sprite_Gauge.prototype.gaugeColor1 = function() {
        if (this._statusType === "limit") return ColorManager.lmtGaugeColor1();
        return Sprite_Gauge_gaugeColor1.call(this);
    };

    const Sprite_Gauge_gaugeColor2 = Sprite_Gauge.prototype.gaugeColor2;
    Sprite_Gauge.prototype.gaugeColor2 = function() {
        if (this._statusType === "limit") return ColorManager.lmtGaugeColor2();
        return Sprite_Gauge_gaugeColor2.call(this);
    };

    const Sprite_Gauge_label = Sprite_Gauge.prototype.label;
    Sprite_Gauge.prototype.label = function() {
        if (this._statusType === "limit") return LIMIT_BASIC_TERM
        return Sprite_Gauge_label.call(this);
    };

    const  Sprite_Gauge_valueColor =  Sprite_Gauge.prototype.valueColor;
    Sprite_Gauge.prototype.valueColor = function() {
        if (this._statusType === "limit") return ColorManager.limitColor(this._battler);
        return Sprite_Gauge_valueColor.call(this);
    };

    const Sprite_Gauge_currentValue = Sprite_Gauge.prototype.currentValue;
    Sprite_Gauge.prototype.currentValue = function() {
        if (this._statusType === "limit") return this._battler.lmt;
        return Sprite_Gauge_currentValue.call(this);
    };

    const Sprite_Gauge_currentMaxValue = Sprite_Gauge.prototype.currentMaxValue;
    Sprite_Gauge.prototype.currentMaxValue = function() {
        if (this._battler && this._statusType === "limit") return this._battler.maxLimit();
        return Sprite_Gauge_currentMaxValue.call(this);
    };

    const Sprite_Gauge_drawValue = Sprite_Gauge.prototype.drawValue;
    Sprite_Gauge.prototype.drawValue = function() {
        if (this._statusType === "limit") return
        Sprite_Gauge_drawValue.call(this);
    };

    const Sprite_Gauge_updateFlashing = Sprite_Gauge.prototype.updateFlashing
    Sprite_Gauge.prototype.updateFlashing = function() {

        Sprite_Gauge_updateFlashing.call(this);

        if (this._statusType === "limit") {
            this._flashingLimitCount++;
            if (this.currentValue() >= 100) {
                if (this._flashingLimitCount % 30 < 15) {
                    this.setBlendColor(this.flashingColor1());
                } else {
                    this.setBlendColor(this.flashingColor2());
                }
            } else {
                this.setBlendColor([0, 0, 0, 0]);
            }
        }
    };

    const Window_StatusBase_placeBasicGauges = Window_StatusBase.prototype.placeBasicGauges;
    Window_StatusBase.prototype.placeBasicGauges = function(actor, x, y) {
        Window_StatusBase_placeBasicGauges.call(this, actor, x, y);
        this.placeGauge(actor, "limit", x, y + this.gaugeLineHeight() * ($dataSystem.optDisplayTp ? 3 : 2));
        
    };

    Window_BattleStatus.prototype.basicGaugesY = function(rect) {
        const bottom = rect.y + rect.height - this.extraHeight();
        const numGauges = $dataSystem.optDisplayTp ? 4 : 3;
        return bottom - this.gaugeLineHeight() * numGauges;
    };

})();
