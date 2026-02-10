import type {AnyNode, AtRule, Declaration, Rule} from 'postcss';

const triggerProps = ['selector', 'value', 'params'] as const;
type TriggerProps = (typeof triggerProps)[number];
type ProxiedRule = Pick<Rule, TriggerProps & keyof Rule>;
type ProxiedDeclaration = Pick<Declaration, TriggerProps & keyof Declaration>;
type ProxiedAtRule = Pick<AtRule, TriggerProps & keyof AtRule>;
export type ProxiedNode = {
  [K in keyof ProxiedRule]: ProxiedRule[K];
} & {
  [K in keyof ProxiedDeclaration]: ProxiedDeclaration[K];
} & {
  [K in keyof ProxiedAtRule]: ProxiedAtRule[K];
} & AnyNode;

/**
 * Proxies a PostCSS node to trigger location correction when certain properties are set.
 * @param node The PostCSS node to proxy
 * @param correctNodeLocation A callback function that corrects the node's location when a property is set
 */
export function proxyNode(
  node: ProxiedNode,
  correctNodeLocation: (node: ProxiedNode) => void
): void {
  const propDescriptors = triggerProps.reduce(
    (descriptors, prop) => {
      const proxiedProp = `litProxied${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
      node.raws[proxiedProp] = node[prop];
      descriptors[prop] = {
        get() {
          return node.raws[proxiedProp];
        },
        set(value) {
          node.raws[proxiedProp] = value;
          correctNodeLocation(node);
        }
      };
      return descriptors;
    },
    {} as Record<string, PropertyDescriptor>
  );
  Object.defineProperties(node, propDescriptors);
}
